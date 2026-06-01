import { CheckCircle2, ClipboardList, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  ReviewGateBadge,
  Section,
  StatusBadge
} from "../../components.js";
import { formatDate, getBundleQueue, getWorkbenchData } from "../../../lib/public-data.js";

function ReadinessBadge({ ready, label }) {
  return <Badge tone={ready ? "good" : "warn"}>{label}</Badge>;
}

export default async function AdminReviewPage() {
  const data = await getWorkbenchData();
  const queue = getBundleQueue(data);
  const openBundles = queue.filter(({ record }) => !["published", "rejected"].includes(record.lifecycle_status));
  const readyForPromotion = queue.filter(({ report }) => report?.promotion?.ready).length;
  const reviewReady = queue.filter(({ report }) => !report?.evidence_review_gate?.eligible || report.evidence_review_gate.ready).length;

  return (
    <main className="page">
      <PageHeader eyebrow="Admin Review" title="Candidate Bundle Queue" aside={<Badge tone="info">Read Only</Badge>}>
        Inspect bundle readiness, review gates, promotion checks, and publication state before adding mutation actions.
      </PageHeader>

      <div className="metrics">
        <Metric icon={ClipboardList} label="Candidate bundles" value={queue.length} />
        <Metric icon={TriangleAlert} label="Open bundles" value={openBundles.length} />
        <Metric icon={CheckCircle2} label="Promotion ready" value={readyForPromotion} />
        <Metric icon={ShieldCheck} label="Review ready" value={reviewReady} />
      </div>

      <Section title="Review Queue" note={`${openBundles.length} open bundle(s)`}>
        {queue.length ? (
          <div className="list">
            {queue.map(({ record, report, scopeNodes }) => (
              <Link className="row-link admin-row" href={`/admin/review/${record.id}`} key={record.id}>
                <span>
                  <strong>{record.name}</strong>
                  <span className="row-kicker">{record.summary}</span>
                  <span className="row-kicker">
                    {scopeNodes.map((node) => node.name).join(", ") || "Unscoped"} - {formatDate(record.submitted_at)}
                  </span>
                </span>
                <span className="meta-row admin-row-meta">
                  <StatusBadge status={record.lifecycle_status} />
                  <ReviewGateBadge report={report} />
                  <ReadinessBadge ready={Boolean(report?.promotion?.ready)} label="Promotion" />
                  <ReadinessBadge ready={Boolean(report?.validation?.ready)} label="Validation" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No candidate bundles for the active domain.</EmptyState>
        )}
      </Section>

      <Section title="Review Surface">
        <div className="grid three">
          <div className="card">
            <div className="card-title">
              <span>
                <ShieldCheck className="icon" size={16} /> Evidence Reviews
              </span>
            </div>
            <p className="card-body">Required lanes, missing lanes, blocking reviews, and open blocking findings.</p>
          </div>
          <div className="card">
            <div className="card-title">
              <span>
                <FileText className="icon" size={16} /> Promotion Files
              </span>
            </div>
            <p className="card-body">Staged files, target files, drift checks, record shape, and reference validation.</p>
          </div>
          <div className="card">
            <div className="card-title">
              <span>
                <ClipboardList className="icon" size={16} /> Publication State
              </span>
            </div>
            <p className="card-body">Publication event requirements and published target summaries for completed bundles.</p>
          </div>
        </div>
      </Section>
    </main>
  );
}
