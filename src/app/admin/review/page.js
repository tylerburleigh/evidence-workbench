import { CheckCircle2, ClipboardList, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Metric, PageHeader, Section } from "../../components.js";
import { optionList } from "../../index-options.js";
import { RecordIndex } from "../../record-index.js";
import { formatDate, getBundleQueue, getStudioData, statusLabel } from "../../../lib/public-data.js";

export default async function AdminReviewPage() {
  const data = await getStudioData();
  const queue = getBundleQueue(data);
  const openBundles = queue.filter(({ record }) => !["published", "rejected"].includes(record.lifecycle_status));
  const readyForPromotion = queue.filter(({ report }) => report?.promotion?.ready).length;
  const appraisalReady = queue.filter(({ report }) => !report?.evidence_appraisal_gate?.eligible || report.evidence_appraisal_gate.ready).length;
  const queueRows = queue.map(({ record, report, scopeNodes }, index) => {
    const appraisalGateReady = !report?.evidence_appraisal_gate?.eligible || Boolean(report.evidence_appraisal_gate.ready);
    const promotionReady = Boolean(report?.promotion?.ready);
    const validationReady = Boolean(report?.validation?.ready);
    const readinessMessage = report?.readiness?.message;
    return {
      id: record.id,
      href: `/admin/review/${record.id}`,
      icon: "ClipboardList",
      title: record.name,
      body: record.summary,
      kicker: `${scopeNodes.map((node) => node.name).join(", ") || "Unscoped"} - ${formatDate(record.submitted_at)}${readinessMessage ? ` - ${readinessMessage}` : ""}`,
      badges: [
        { label: statusLabel(record.lifecycle_status), tone: ["published", "approved"].includes(record.lifecycle_status) ? "good" : "neutral" },
        { label: appraisalGateReady ? "Appraisal ready" : "Appraisal blocked", tone: appraisalGateReady ? "good" : "warn" },
        { label: promotionReady ? "Promotion ready" : "Promotion blocked", tone: promotionReady ? "good" : "warn" },
        { label: validationReady ? "Validation ready" : "Validation blocked", tone: validationReady ? "good" : "warn" }
      ],
      filterValues: {
        status: record.lifecycle_status,
        appraisal_gate: appraisalGateReady ? "ready" : "blocked",
        promotion: promotionReady ? "ready" : "blocked",
        validation: validationReady ? "ready" : "blocked"
      },
      searchText: [
        record.name,
        record.id,
        record.summary,
        record.lifecycle_status,
        record.intake_mode,
        record.submitted_by,
        record.scope?.research_question,
        readinessMessage,
        ...scopeNodes.map((node) => node.name)
      ].join(" "),
      sortValues: {
        queue: index,
        submitted: record.submitted_at ?? "",
        status: record.lifecycle_status,
        name: record.name
      }
    };
  });

  return (
    <main className="page">
      <PageHeader eyebrow="Admin Review" title="Candidate Bundle Queue" aside={<Badge tone="info">Read Only</Badge>}>
        Inspect bundle readiness, appraisal gates, promotion checks, and publication state before adding mutation actions.
      </PageHeader>

      <div className="metrics">
        <Metric icon={ClipboardList} label="Candidate bundles" value={queue.length} />
        <Metric icon={TriangleAlert} label="Open bundles" value={openBundles.length} />
        <Metric icon={CheckCircle2} label="Promotion ready" value={readyForPromotion} />
        <Metric icon={ShieldCheck} label="Appraisal ready" value={appraisalReady} />
      </div>

      <Section title="Bundle Queue" note={`${openBundles.length} open bundle(s)`}>
        <RecordIndex
          emptyMessage="No candidate bundles match the current filters."
          filters={[
            {
              id: "status",
              label: "Status",
              options: optionList(queue, ({ record }) => record.lifecycle_status, statusLabel)
            },
            {
              id: "appraisal_gate",
              label: "Appraisal Gate",
              options: [
                { value: "ready", label: "Ready" },
                { value: "blocked", label: "Blocked" }
              ]
            },
            {
              id: "promotion",
              label: "Promotion",
              options: [
                { value: "ready", label: "Ready" },
                { value: "blocked", label: "Blocked" }
              ]
            },
            {
              id: "validation",
              label: "Validation",
              options: [
                { value: "ready", label: "Ready" },
                { value: "blocked", label: "Blocked" }
              ]
            }
          ]}
          items={queueRows}
          sortOptions={[
            { id: "queue", label: "Queue order" },
            { id: "submitted", label: "Newest", direction: "desc" },
            { id: "status", label: "Status" },
            { id: "name", label: "Name" }
          ]}
          variant="list"
        />
      </Section>

      <Section title="Appraisal Surface">
        <div className="grid three">
          <div className="card">
            <div className="card-title">
              <span>
                <ShieldCheck className="icon" size={16} /> Evidence Appraisals
              </span>
            </div>
            <p className="card-body">Required lanes, missing lanes, blocking appraisals, and open blocking findings.</p>
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
