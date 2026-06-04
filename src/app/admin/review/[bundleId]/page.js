import { CheckCircle2, CircleAlert, FileJson, GitPullRequest, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  BreadcrumbLink,
  EmptyState,
  PageHeader,
  AppraisalGateBadge,
  Section,
  StatusBadge
} from "../../../components.js";
import {
  formatDate,
  getBundleById,
  getBundleReport,
  getEvidenceAppraisalsForBundle,
  getNodesForIds,
  getPublicationEventsForBundle,
  getEditorialCommentsForBundle,
  getStudioData,
  statusLabel
} from "../../../../lib/public-data.js";
import {
  addCommentAction,
  approveBundleAction,
  publishBundleAction,
  rejectBundleAction,
  requestChangesAction
} from "../actions.js";

function ReadinessCard({ icon: Icon, title, ready, children }) {
  return (
    <div className="card readiness-card">
      <div className="card-title">
        <span>
          <Icon className="icon" size={16} /> {title}
        </span>
        <Badge tone={ready ? "good" : "warn"}>{ready ? "Ready" : "Blocked"}</Badge>
      </div>
      {children ? <div className="card-body">{children}</div> : null}
    </div>
  );
}

function IssueList({ issues = [], warnings = [] }) {
  if (!issues.length && !warnings.length) {
    return <p className="row-kicker">No issues or warnings.</p>;
  }

  return (
    <div className="support-list compact-list">
      {issues.map((issue) => (
        <div className="support-item danger-item" key={issue}>
          <h3>Issue</h3>
          <p>{issue}</p>
        </div>
      ))}
      {warnings.map((warning) => (
        <div className="support-item warn-item" key={warning}>
          <h3>Warning</h3>
          <p>{warning}</p>
        </div>
      ))}
    </div>
  );
}

function FilePath({ children }) {
  return <code className="path-value">{children}</code>;
}

function ActionNotice({ notice, error }) {
  if (!notice && !error) {
    return null;
  }

  return <div className={error ? "action-notice error" : "action-notice"}>{error ?? notice}</div>;
}

function HiddenBundleId({ bundleId }) {
  return <input name="bundleId" type="hidden" value={bundleId} />;
}

function ActionBlockers({ title, blockers }) {
  if (!blockers.length) {
    return <p className="action-hint">{title} is available.</p>;
  }

  return (
    <div className="action-hint blocked">
      <strong>{title} blocked</strong>
      <ul>
        {blockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
    </div>
  );
}

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBundleDetailPage({ params, searchParams }) {
  const { bundleId } = await params;
  const query = searchParams ? await searchParams : {};
  const data = await getStudioData();
  const bundle = getBundleById(data, bundleId);
  if (!bundle) {
    notFound();
  }

  const report = getBundleReport(data, bundle.id);
  const scopeNodes = getNodesForIds(data, bundle.scope?.taxonomy_node_ids ?? []);
  const appraisals = getEvidenceAppraisalsForBundle(data, bundle.id);
  const comments = getEditorialCommentsForBundle(data, bundle.id);
  const publicationEvents = getPublicationEventsForBundle(data, bundle.id);
  const evidenceGate = report?.evidence_appraisal_gate;
  const promotion = report?.promotion;
  const publication = report?.publication;
  const validation = report?.validation;
  const workflowAudit = report?.workflow_audit;
  const projectedDeltaRows = Object.entries(workflowAudit?.projected_publication_delta?.by_record_type ?? {});
  const appraisalGateReady = !evidenceGate?.eligible || Boolean(evidenceGate?.ready);
  const canRequestChanges = ["submitted", "in_review", "needs_revision"].includes(bundle.lifecycle_status);
  const canReject = !["published", "rejected"].includes(bundle.lifecycle_status);
  const canApprove = ["submitted", "in_review", "revised"].includes(bundle.lifecycle_status) && Boolean(validation?.ready) && appraisalGateReady;
  const canPublish = bundle.lifecycle_status === "approved" && Boolean(validation?.ready) && appraisalGateReady;
  const approvalBlockers = [
    !["submitted", "in_review", "revised"].includes(bundle.lifecycle_status)
      ? `Status must be submitted, in review, or revised. Current status is ${statusLabel(bundle.lifecycle_status)}.`
      : undefined,
    validation?.ready ? undefined : validation?.issues?.join(" ") || "Validation has not passed.",
    appraisalGateReady ? undefined : evidenceGate?.issues?.join(" ") || "Evidence appraisal gate has not passed."
  ].filter(Boolean);
  const publishBlockers = [
    bundle.lifecycle_status === "approved"
      ? undefined
      : `Status must be approved before publication. Current status is ${statusLabel(bundle.lifecycle_status)}.`,
    validation?.ready ? undefined : validation?.issues?.join(" ") || "Validation has not passed.",
    appraisalGateReady ? undefined : evidenceGate?.issues?.join(" ") || "Evidence appraisal gate has not passed."
  ].filter(Boolean);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Admin Review"
        title={bundle.name}
        aside={
          <>
            <StatusBadge status={bundle.lifecycle_status} />
            <Badge>Revision {bundle.revision_number ?? 1}</Badge>
          </>
        }
      >
        {bundle.summary}
      </PageHeader>

      <div className="meta-row">
        <BreadcrumbLink href="/admin/review">Bundle Queue</BreadcrumbLink>
        <Badge>{bundle.intake_mode}</Badge>
        <Badge>{formatDate(bundle.submitted_at)}</Badge>
      </div>

      <ActionNotice notice={queryValue(query.notice)} error={queryValue(query.error)} />

      {report?.readiness?.message ? <p className="section-note">{report.readiness.message}</p> : null}

      <div className="grid four readiness-grid">
        <ReadinessCard icon={CheckCircle2} title="Validation" ready={Boolean(validation?.ready)}>
          {validation?.ready ? "Bundle shape, references, and publication state are valid." : validation?.issues?.join(" ")}
        </ReadinessCard>
        <ReadinessCard icon={FileJson} title="Promotion" ready={Boolean(promotion?.ready)}>
          {promotion?.ready ? "Staged files can be promoted to target records." : promotion?.issues?.join(" ")}
        </ReadinessCard>
        <ReadinessCard icon={ShieldCheck} title="Evidence Gate" ready={!evidenceGate?.eligible || Boolean(evidenceGate?.ready)}>
          {evidenceGate?.eligible ? evidenceGate.issues.join(" ") || "Required appraisal lanes are complete." : "No appraisal gate required."}
        </ReadinessCard>
        <ReadinessCard icon={GitPullRequest} title="Publication" ready={Boolean(publication?.ready)}>
          {publication?.eligible ? publication.issues?.join(" ") || "Publication event state is valid." : "Not published yet."}
        </ReadinessCard>
      </div>

      <Section title="Actions">
        <div className="grid two admin-actions-grid">
          <form action={addCommentAction} className="action-form comment-action-form">
            <HiddenBundleId bundleId={bundle.id} />
            <label className="form-label" htmlFor="comment-body">
              Editorial Comment
            </label>
            <textarea
              className="text-area"
              id="comment-body"
              name="body"
              placeholder="Add a note for the review history."
              rows={4}
            />
            <button className="action-button" type="submit">
              <MessageSquare size={15} /> Add Comment
            </button>
          </form>

          <div className="action-stack">
            <form action={requestChangesAction} className="action-form">
              <HiddenBundleId bundleId={bundle.id} />
              <label className="form-label" htmlFor="request-reason">
                Revision Request
              </label>
              <textarea
                className="text-area"
                id="request-reason"
                name="reason"
                placeholder="State what must change before approval."
                rows={3}
              />
              <button className="action-button secondary" disabled={!canRequestChanges} type="submit">
                <CircleAlert size={15} /> Request Changes
              </button>
            </form>

            <div className="action-button-row">
              <form action={approveBundleAction}>
                <HiddenBundleId bundleId={bundle.id} />
                <button className="action-button" disabled={!canApprove} type="submit">
                  <CheckCircle2 size={15} /> Approve
                </button>
              </form>
              <form action={publishBundleAction}>
                <HiddenBundleId bundleId={bundle.id} />
                <button className="action-button" disabled={!canPublish} type="submit">
                  <GitPullRequest size={15} /> Publish
                </button>
              </form>
            </div>
            <ActionBlockers title="Approval" blockers={approvalBlockers} />
            <ActionBlockers title="Publication" blockers={publishBlockers} />

            <form action={rejectBundleAction} className="action-form compact-action-form">
              <HiddenBundleId bundleId={bundle.id} />
              <label className="form-label" htmlFor="reject-reason">
                Rejection Reason
              </label>
              <textarea
                className="text-area"
                id="reject-reason"
                name="reason"
                placeholder="Record why this bundle should not proceed."
                rows={3}
              />
              <button className="action-button danger" disabled={!canReject} type="submit">
                <CircleAlert size={15} /> Reject
              </button>
            </form>
          </div>
        </div>
      </Section>

      <div className="split">
        <Section title="Scope">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Domain</th>
                <td>{bundle.scope?.domain_id}</td>
              </tr>
              <tr>
                <th>Scope Units</th>
                <td>
                  {scopeNodes.length
                    ? scopeNodes.map((node, index) => (
                        <span key={node.id}>
                          {index > 0 ? ", " : null}
                          <Link className="text-link" href={`/scope/${node.id}`}>
                            {node.name}
                          </Link>
                        </span>
                      ))
                    : "Unscoped"}
                </td>
              </tr>
              <tr>
                <th>Question</th>
                <td>{bundle.scope?.research_question ?? "Unspecified"}</td>
              </tr>
              <tr>
                <th>Submitted By</th>
                <td>{bundle.submitted_by ?? "Unspecified"}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="Appraisal Gate">
          {evidenceGate ? (
            <>
              <div className="meta-row">
                <AppraisalGateBadge report={report} />
                <Badge>{evidenceGate.completed_lanes.length}/{evidenceGate.required_lanes.length} lane(s)</Badge>
                <Badge>{evidenceGate.min_complete_appraisals_per_lane} appraisal(s) per lane</Badge>
              </div>
              <div className="meta-row">
                {evidenceGate.required_lanes.map((lane) => (
                  <Badge tone={evidenceGate.completed_lanes.includes(lane) ? "good" : "warn"} key={lane}>
                    {statusLabel(lane)}
                  </Badge>
                ))}
              </div>
              <IssueList issues={evidenceGate.issues} />
            </>
          ) : (
            <EmptyState>No bundle report is available.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Workflow Audit">
        {workflowAudit ? (
          <>
            <div className="meta-row">
              <Badge tone={workflowAudit.ready ? "good" : "warn"}>{workflowAudit.ready ? "Ready" : "Blocked"}</Badge>
              <Badge>{workflowAudit.source_depth?.checks?.length ?? 0} source-depth check(s)</Badge>
              <Badge>{workflowAudit.source_access?.checks?.length ?? 0} source-access check(s)</Badge>
              <Badge>{workflowAudit.search_linkage?.checks?.length ?? 0} search-linkage check(s)</Badge>
            </div>
            <IssueList issues={workflowAudit.issues} warnings={workflowAudit.warnings} />
            {projectedDeltaRows.length ? (
              <table className="detail-table compact-table">
                <thead>
                  <tr>
                    <th>Record Type</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {projectedDeltaRows.map(([recordType, delta]) => (
                    <tr key={recordType}>
                      <td>{recordType}</td>
                      <td>{delta.created ?? 0}</td>
                      <td>{delta.updated ?? 0}</td>
                      <td>{delta.total ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </>
        ) : (
          <EmptyState>No workflow audit is available.</EmptyState>
        )}
      </Section>

      <Section title="Proposed Changes" note={`${bundle.proposed_changes?.length ?? 0} change(s)`}>
        {promotion?.changes?.length ? (
          <div className="grid two">
            {promotion.changes.map((change) => (
              <div className="card" key={change.change_id}>
                <div className="card-title">
                  <span>{statusLabel(change.change_id)}</span>
                  <Badge tone={change.ready ? "good" : "warn"}>{change.ready ? "Ready" : "Blocked"}</Badge>
                </div>
                <table className="detail-table compact-table">
                  <tbody>
                    <tr>
                      <th>Type</th>
                      <td>{change.change_type}</td>
                    </tr>
                    <tr>
                      <th>Record</th>
                      <td>
                        {change.target_record_type}/{change.target_record_id}
                      </td>
                    </tr>
                    <tr>
                      <th>Staged</th>
                      <td><FilePath>{change.staged_file_path}</FilePath></td>
                    </tr>
                    <tr>
                      <th>Target</th>
                      <td><FilePath>{change.target_file_path}</FilePath></td>
                    </tr>
                  </tbody>
                </table>
                <IssueList issues={change.issues} warnings={change.warnings} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No promotion changes are available.</EmptyState>
        )}
      </Section>

      <Section title="Evidence Appraisals" note={`${appraisals.length} appraisal(s)`}>
        {appraisals.length ? (
          <div className="grid two">
            {appraisals.map((review) => (
              <div className="card" key={review.id}>
                <div className="card-title">
                  <span>{review.name}</span>
                  <StatusBadge status={review.verdict} />
                </div>
                <p className="card-body">{review.summary}</p>
                <div className="meta-row">
                  <Badge>{statusLabel(review.appraisal_lane)}</Badge>
                  <Badge>{review.status}</Badge>
                  <Badge tone={review.blocking ? "danger" : "good"}>{review.blocking ? "Blocking" : "Non-blocking"}</Badge>
                </div>
                {review.findings?.length ? (
                  <div className="support-list compact-list">
                    {review.findings.map((finding) => (
                      <div className="support-item" key={finding.finding_id}>
                        <h3>{finding.finding_id}</h3>
                        <p>{finding.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No evidence appraisals have been recorded for this bundle.</EmptyState>
        )}
      </Section>

      <div className="split">
        <Section title="Publication Events" note={`${publicationEvents.length} event(s)`}>
          {publicationEvents.length ? (
            <div className="list">
              {publicationEvents.map((event) => (
                <div className="row" key={event.id}>
                  <span>
                    <strong>{event.name}</strong>
                    <span className="row-kicker">{event.change_note ?? event.summary}</span>
                  </span>
                  <Badge>{formatDate(event.published_at)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No publication event has been written for this bundle.</EmptyState>
          )}
        </Section>

        <Section title="Editorial Comments" note={`${comments.length} comment(s)`}>
          {comments.length ? (
            <div className="list">
              {comments.map((comment) => (
                <div className="row" key={comment.id}>
                  <span>
                    <strong>{comment.author ?? "Comment"}</strong>
                    <span className="row-kicker">{comment.body ?? comment.summary}</span>
                  </span>
                  <Badge>{formatDate(comment.created_at)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No editorial comments have been recorded.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Next Actions">
        {bundle.next_actions?.length ? (
          <div className="support-list">
            {bundle.next_actions.map((action) => (
              <div className="support-item" key={action}>
                <h3>
                  <MessageSquare className="icon" size={15} /> Action
                </h3>
                <p>{action}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No next actions are listed.</EmptyState>
        )}
      </Section>
    </main>
  );
}
