import { CheckCircle2, ClipboardCheck, Layers, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  RecordCard,
  Section,
  StatusBadge
} from "../components.js";
import {
  getConfidenceEntries,
  getDefaultAppraisalLaneIds,
  getPublicLabels,
  getStageLabel,
  getStudioData,
  statusLabel
} from "../../lib/public-data.js";

export default async function MethodsPage() {
  const data = await getStudioData();
  const labels = getPublicLabels(data);
  const defaultLaneIds = getDefaultAppraisalLaneIds(data);
  const stages = data.domainPack.evidenceLadder.stages ?? [];
  const lanes = data.domainPack.appraisalLanes.lanes ?? [];
  const confidenceEntries = getConfidenceEntries(data);
  const avoidList = data.domainPack.domain.public_claim_language?.avoid ?? [];

  return (
    <main className="page">
      <PageHeader
        eyebrow="Methods"
        title="Trust Model"
        aside={<Badge tone="info">{data.domainPack.domain.public_claim_language?.default_posture ?? "bounded_summary"}</Badge>}
      >
        The public browser separates source-backed material, curator interpretation, configured context, and update activity
        so published claims stay inspectable.
      </PageHeader>

      <div className="metrics">
        <Metric icon={Layers} label="Evidence stages" value={stages.length} />
        <Metric icon={ClipboardCheck} label="Appraisal lanes" value={lanes.length} />
        <Metric icon={CheckCircle2} label="Default lanes" value={defaultLaneIds.size} />
        <Metric icon={ShieldCheck} label="Published claims" value={data.collections.claims.length} />
      </div>

      <Section title="Layer Separation">
        <div className="grid three">
          <RecordCard
            icon={Layers}
            title={labels.evidence_layer ?? "Evidence"}
            body="Source records, artifacts, and findings preserve the inspectable basis for a public claim."
          />
          <RecordCard
            icon={ShieldCheck}
            title={labels.interpretation_layer ?? "Interpretation"}
            body="Claims and support maps explain what the curated evidence does and does not support."
          />
          <RecordCard
            icon={TriangleAlert}
            title={labels.context_layer ?? "Context"}
            body="Configured caveats, scope boundaries, and uncertainty stay visible near conclusions."
          />
        </div>
      </Section>

      <Section title="Evidence Ladder" note={`${stages.length} configured stage(s)`}>
        {stages.length ? (
          <div className="list">
            {stages.map((stage) => (
              <div className="card" key={stage.id}>
                <div className="card-title">
                  <span>{getStageLabel(data, stage)}</span>
                  <Badge>{stage.id}</Badge>
                </div>
                <p className="card-body">{stage.description}</p>
                <table className="detail-table compact-table">
                  <tbody>
                    <tr>
                      <th>Minimum Support</th>
                      <td>{stage.minimum_support_expected}</td>
                    </tr>
                    <tr>
                      <th>Overclaim Risk</th>
                      <td>{stage.common_overclaim_risk}</td>
                    </tr>
                    <tr>
                      <th>Next Stage</th>
                      <td>{stage.moves_to_next_stage}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No evidence ladder is configured for this domain.</EmptyState>
        )}
      </Section>

      <div className="split">
        <Section title="Review Process" note={`${defaultLaneIds.size} default lane(s)`}>
          {lanes.length ? (
            <div className="support-list">
              {lanes.map((lane) => (
                <div className="support-item" key={lane.id}>
                  <h3>{lane.label}</h3>
                  <p>{lane.description}</p>
                  <div className="meta-row">
                    <Badge>{lane.id}</Badge>
                    {defaultLaneIds.has(lane.id) || lane.required_by_default ? (
                      <Badge tone="good">Default</Badge>
                    ) : (
                      <Badge>Optional</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No appraisal lanes are configured for this domain.</EmptyState>
          )}
        </Section>

        <Section title="Confidence Labels">
          {confidenceEntries.length ? (
            <div className="list">
              {confidenceEntries.map(([id, label]) => (
                <div className="row" key={id}>
                  <span>
                    <strong>{label}</strong>
                    <span className="row-kicker">{id}</span>
                  </span>
                  <StatusBadge status={id} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No confidence labels are configured for this domain.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Publication Boundaries">
        <div className="grid two">
          <div className="card">
            <div className="card-title">
              <span>What Updates Mean</span>
            </div>
            <p className="card-body">
              Activity records show what changed and when. They are operational history, not evidence for the claim.
              Evidence remains inspectable through sources, artifacts, findings, and support maps.
            </p>
          </div>
          <div className="card">
            <div className="card-title">
              <span>What Claims Avoid</span>
            </div>
            {avoidList.length ? (
              <div className="meta-row">
                {avoidList.map((item) => (
                  <Badge key={item}>{statusLabel(item)}</Badge>
                ))}
              </div>
            ) : (
              <p className="card-body">No domain-specific avoid list is configured.</p>
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}
