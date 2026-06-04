function formValue(formData, key) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function resultPath(bundleId, type, message) {
  const params = new URLSearchParams({ [type]: message });
  return `/admin/review/${bundleId}?${params.toString()}`;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Action failed.";
}

export function createAdminReviewActionHandlers({
  addReviewComment,
  approveCandidateBundle,
  loadDomainStudioData,
  publishCandidateBundle,
  revalidateAdminPaths,
  updateCandidateBundleStatus,
  authorId = "local-curator",
  publishedBy = "local-curator"
}) {
  async function assertActiveDomainBundle(bundleId) {
    const data = await loadDomainStudioData();
    const belongsToActiveDomain = data.collections.candidateBundles.some(({ record }) => record.id === bundleId);
    if (!belongsToActiveDomain) {
      throw new Error(`Bundle is not part of the active domain: ${bundleId}`);
    }
  }

  async function runBundleAction(formData, mutation, successMessage) {
    const bundleId = formValue(formData, "bundleId");
    if (!bundleId) {
      return "/admin/review?error=Missing%20bundle%20id.";
    }

    try {
      await assertActiveDomainBundle(bundleId);
      await mutation(bundleId);
      await revalidateAdminPaths(bundleId);
      return resultPath(bundleId, "notice", successMessage);
    } catch (error) {
      return resultPath(bundleId, "error", errorMessage(error));
    }
  }

  return {
    addComment(formData) {
      const body = formValue(formData, "body");
      return runBundleAction(
        formData,
        (bundleId) =>
          addReviewComment(bundleId, {
            body,
            authorKind: "human",
            authorId
          }),
        "Review comment added."
      );
    },

    requestChanges(formData) {
      const reason = formValue(formData, "reason");
      return runBundleAction(
        formData,
        (bundleId) =>
          updateCandidateBundleStatus(bundleId, "needs_revision", {
            reason
          }),
        "Bundle marked as needing revision."
      );
    },

    reject(formData) {
      const reason = formValue(formData, "reason");
      return runBundleAction(
        formData,
        (bundleId) =>
          updateCandidateBundleStatus(bundleId, "rejected", {
            reason
          }),
        "Bundle rejected."
      );
    },

    approve(formData) {
      return runBundleAction(formData, (bundleId) => approveCandidateBundle(bundleId), "Bundle approved.");
    },

    publish(formData) {
      return runBundleAction(
        formData,
        (bundleId) =>
          publishCandidateBundle(bundleId, {
            publishedBy
          }),
        "Bundle published."
      );
    }
  };
}
