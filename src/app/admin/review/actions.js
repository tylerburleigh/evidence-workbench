"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addReviewComment,
  approveCandidateBundle,
  publishCandidateBundle,
  updateCandidateBundleStatus
} from "../../../../scripts/lib/bundle-workflow.mjs";
import { loadDomainWorkbenchData } from "../../../../scripts/lib/workbench-data.mjs";

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

function revalidateAdminPaths(bundleId) {
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/scope");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${bundleId}`);
}

async function assertActiveDomainBundle(bundleId) {
  const data = await loadDomainWorkbenchData();
  const belongsToActiveDomain = data.collections.candidateBundles.some(({ record }) => record.id === bundleId);
  if (!belongsToActiveDomain) {
    throw new Error(`Bundle is not part of the active domain: ${bundleId}`);
  }
}

async function runBundleAction(formData, mutation, successMessage) {
  const bundleId = formValue(formData, "bundleId");
  if (!bundleId) {
    redirect("/admin/review?error=Missing%20bundle%20id.");
  }

  let targetPath;
  try {
    await assertActiveDomainBundle(bundleId);
    await mutation(bundleId);
    revalidateAdminPaths(bundleId);
    targetPath = resultPath(bundleId, "notice", successMessage);
  } catch (error) {
    targetPath = resultPath(bundleId, "error", errorMessage(error));
  }

  redirect(targetPath);
}

export async function addCommentAction(formData) {
  const body = formValue(formData, "body");
  await runBundleAction(
    formData,
    (bundleId) =>
      addReviewComment(bundleId, {
        body,
        authorKind: "human",
        authorId: "local-curator"
      }),
    "Review comment added."
  );
}

export async function requestChangesAction(formData) {
  const reason = formValue(formData, "reason");
  await runBundleAction(
    formData,
    (bundleId) =>
      updateCandidateBundleStatus(bundleId, "needs_revision", {
        reason
      }),
    "Bundle marked as needing revision."
  );
}

export async function rejectBundleAction(formData) {
  const reason = formValue(formData, "reason");
  await runBundleAction(
    formData,
    (bundleId) =>
      updateCandidateBundleStatus(bundleId, "rejected", {
        reason
      }),
    "Bundle rejected."
  );
}

export async function approveBundleAction(formData) {
  await runBundleAction(formData, (bundleId) => approveCandidateBundle(bundleId), "Bundle approved.");
}

export async function publishBundleAction(formData) {
  await runBundleAction(
    formData,
    (bundleId) =>
      publishCandidateBundle(bundleId, {
        publishedBy: "local-curator"
      }),
    "Bundle published."
  );
}
