"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addEditorialComment,
  approveCandidateBundle,
  publishCandidateBundle,
  updateCandidateBundleStatus
} from "../../../../scripts/lib/bundle-workflow.mjs";
import { loadDomainStudioData } from "../../../../scripts/lib/studio-data.mjs";
import { createAdminReviewActionHandlers } from "./action-handlers.js";

function revalidateAdminPaths(bundleId) {
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/scope");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${bundleId}`);
}

const actionHandlers = createAdminReviewActionHandlers({
  addEditorialComment,
  approveCandidateBundle,
  loadDomainStudioData,
  publishCandidateBundle,
  revalidateAdminPaths,
  updateCandidateBundleStatus
});

export async function addCommentAction(formData) {
  redirect(await actionHandlers.addComment(formData));
}

export async function requestChangesAction(formData) {
  redirect(await actionHandlers.requestChanges(formData));
}

export async function rejectBundleAction(formData) {
  redirect(await actionHandlers.reject(formData));
}

export async function approveBundleAction(formData) {
  redirect(await actionHandlers.approve(formData));
}

export async function publishBundleAction(formData) {
  redirect(await actionHandlers.publish(formData));
}
