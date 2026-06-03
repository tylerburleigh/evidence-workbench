import { Archive, FileText, FlaskConical, Layers } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Badge,
  BreadcrumbLink,
  EmptyState,
  PageHeader,
  RecordCard,
  ReviewGateBadge,
  Section,
  SourceAccessBadge,
  StatusBadge,
  SupportMap
} from "../../components.js";
import {
  getArtifactsForNode,
  getBundlesForNode,
  getClaimsForNode,
  getFindingsForNode,
  getNodeById,
  getParentNode,
  getScopeLabel,
  getSourcesForIds,
  getWorkbenchData
} from "../../../lib/public-data.js";

export default async function TopicDetailPage({ params }) {
  const { nodeId } = await params;
  const data = await getWorkbenchData();
  const node = getNodeById(data, nodeId);
  if (!node) {
    notFound();
  }

  const parent = getParentNode(data, node);
  const scopeLabel = getScopeLabel(data);
  const claims = getClaimsForNode(data, node.id);
  const findings = getFindingsForNode(data, node.id);
  const artifacts = getArtifactsForNode(data, node.id);
  const bundles = getBundlesForNode(data, node.id);
  const sourceIds = new Set([
    ...findings.map((finding) => finding.source_id),
    ...artifacts.flatMap((artifact) => artifact.source_ids ?? []),
    ...claims.flatMap((claim) => claim.supporting_source_ids ?? [])
  ]);
  const sources = getSourcesForIds(data, sourceIds);
  const coverage = data.planning.coverageStatus?.nodes?.find((row) => row.taxonomy_node_id === node.id);

  return (
    <main className="page">
      <PageHeader
        eyebrow={scopeLabel}
        title={node.name}
        aside={<StatusBadge status={coverage?.coverage_status ?? "not_started"} />}
      >
        {node.summary}
      </PageHeader>

      {parent ? (
        <div className="meta-row">
          <BreadcrumbLink href="/scope">{parent.name}</BreadcrumbLink>
          <Badge>{node.node_type}</Badge>
        </div>
      ) : null}

      <div className="split">
        <Section title="Claims">
          {claims.length ? (
            <div className="support-list">
              {claims.map((claim) => (
                <div className="card" key={claim.id}>
                  <div className="card-title">
                    <span className="record-title">{claim.name}</span>
                    <a className="text-link" href={`/claims/${claim.id}`}>
                      Open
                    </a>
                  </div>
                  <div className="card-body">{claim.summary}</div>
                  <div className="meta-row">
                    <Badge>{claim.current_stage}</Badge>
                    <Badge>{claim.confidence}</Badge>
                  </div>
                  {claim.supporting_evidence?.length ? (
                    <div className="section">
                      <h3>Support Map</h3>
                      <div className="support-list">
                        {claim.supporting_evidence.map((support) => (
                          <SupportMap key={support.label} support={support} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No published claims for this {scopeLabel.toLowerCase()}.</EmptyState>
          )}
        </Section>

        <Section title="Bundle State">
          {bundles.length ? (
            <div className="list">
              {bundles.map(({ record, report }) => (
                <div className="row" key={record.id}>
                  <span>
                    <strong>{record.name}</strong>
                    <span className="row-kicker">{record.id}</span>
                  </span>
                  <span className="meta-row">
                    <StatusBadge status={record.lifecycle_status} />
                    <ReviewGateBadge report={report} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No bundles for this {scopeLabel.toLowerCase()}.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Findings" note={`${findings.length} record(s)`}>
        {findings.length ? (
          <div className="grid two">
            {findings.map((finding) => (
              <RecordCard
                key={finding.id}
                href={`/findings/${finding.id}`}
                icon={FlaskConical}
                title={finding.name}
                body={finding.statement}
                meta={
                  <>
                    <Badge>{finding.evidence_tier}</Badge>
                    <Badge>{finding.confidence}</Badge>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published findings for this {scopeLabel.toLowerCase()}.</EmptyState>
        )}
      </Section>

      <Section title="Artifacts">
        {artifacts.length ? (
          <div className="grid two">
            {artifacts.map((artifact) => (
              <RecordCard
                key={artifact.id}
                href={`/artifacts/${artifact.id}`}
                icon={FileText}
                title={artifact.name}
                body={artifact.methods}
                meta={<Badge>{artifact.artifact_type}</Badge>}
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published artifacts for this {scopeLabel.toLowerCase()}.</EmptyState>
        )}
      </Section>

      <Section title="Sources">
        {sources.length ? (
          <div className="grid two">
            {sources.map((source) => (
              <RecordCard
                key={source.id}
                href={`/sources/${source.id}`}
                icon={Archive}
                title={source.name}
                body={source.summary}
                meta={
                  <>
                    <Badge>{source.source_type}</Badge>
                    <SourceAccessBadge source={source} />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published sources for this {scopeLabel.toLowerCase()}.</EmptyState>
        )}
      </Section>
    </main>
  );
}
