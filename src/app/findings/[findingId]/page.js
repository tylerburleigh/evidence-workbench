import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Breadcrumbs, EmptyState, PageHeader, Section, SourceAccessBadge } from "../../components.js";
import { getArtifactById, getFindingById, getNodeById, getSourceById, getWorkbenchData } from "../../../lib/public-data.js";

export default async function FindingDetailPage({ params }) {
  const { findingId } = await params;
  const data = await getWorkbenchData();
  const finding = getFindingById(data, findingId);
  if (!finding) {
    notFound();
  }

  const source = getSourceById(data, finding.source_id);
  const artifact = finding.artifact_id ? getArtifactById(data, finding.artifact_id) : undefined;
  const nodes = (finding.taxonomy_node_ids ?? []).map((nodeId) => getNodeById(data, nodeId)).filter(Boolean);

  return (
    <main className="page">
      <Breadcrumbs
        items={[
          { href: "/findings", label: "Findings" },
          ...(source ? [{ href: `/sources/${source.id}`, label: source.name }] : []),
          { label: finding.name }
        ]}
      />

      <PageHeader
        eyebrow="Finding"
        title={finding.name}
        aside={
          <>
            <Badge>{finding.evidence_tier}</Badge>
            <Badge>{finding.confidence}</Badge>
            {source ? <SourceAccessBadge source={source} /> : null}
          </>
        }
      >
        {finding.statement}
      </PageHeader>

      <div className="split">
        <Section title="Details">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Endpoint</th>
                <td>{finding.endpoint_category}</td>
              </tr>
              <tr>
                <th>Direction</th>
                <td>{finding.direction}</td>
              </tr>
              <tr>
                <th>Context</th>
                <td>{finding.population_or_context || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Quantitative note</th>
                <td>{finding.quantitative_note || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Caveats</th>
                <td>{finding.caveats?.join("; ") || "Unspecified"}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="Links">
          <div className="list">
            {source ? (
              <Link className="row-link" href={`/sources/${source.id}`}>
                <span>
                  <strong>{source.name}</strong>
                  <span className="row-kicker">Source</span>
                </span>
                <span className="meta-row">
                  <Badge>{source.source_type}</Badge>
                  <SourceAccessBadge source={source} />
                </span>
              </Link>
            ) : null}
            {artifact ? (
              <Link className="row-link" href={`/artifacts/${artifact.id}`}>
                <span>
                  <strong>{artifact.name}</strong>
                  <span className="row-kicker">Artifact</span>
                </span>
                <Badge>{artifact.artifact_type}</Badge>
              </Link>
            ) : null}
            {nodes.map((node) => (
              <Link className="row-link" href={`/scope/${node.id}`} key={node.id}>
                <span>
                  <strong>{node.name}</strong>
                  <span className="row-kicker">Scope</span>
                </span>
                <Badge>{node.node_type}</Badge>
              </Link>
            ))}
            {!source && !artifact && nodes.length === 0 ? <EmptyState>No linked records.</EmptyState> : null}
          </div>
        </Section>
      </div>
    </main>
  );
}
