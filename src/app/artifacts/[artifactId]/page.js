import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Breadcrumbs, EmptyState, PageHeader, Section } from "../../components.js";
import {
  getApplicabilityFacetEntries,
  getArtifactById,
  getNodeById,
  getSourceById,
  getStudioData
} from "../../../lib/public-data.js";

export default async function ArtifactDetailPage({ params }) {
  const { artifactId } = await params;
  const data = await getStudioData();
  const artifact = getArtifactById(data, artifactId);
  if (!artifact) {
    notFound();
  }

  const sources = (artifact.source_ids ?? []).map((sourceId) => getSourceById(data, sourceId)).filter(Boolean);
  const nodes = (artifact.taxonomy_node_ids ?? []).map((nodeId) => getNodeById(data, nodeId)).filter(Boolean);
  const findings = data.collections.findings
    .map(({ record }) => record)
    .filter((finding) => finding.artifact_id === artifact.id);
  const applicabilityFacets = getApplicabilityFacetEntries(data, artifact, "artifact");

  return (
    <main className="page">
      <Breadcrumbs
        items={[
          { href: "/artifacts", label: "Artifacts" },
          ...(sources[0] ? [{ href: `/sources/${sources[0].id}`, label: sources[0].name }] : []),
          { label: artifact.name }
        ]}
      />

      <PageHeader
        eyebrow="Artifact"
        title={artifact.name}
        aside={
          <>
            <Badge>{artifact.artifact_type}</Badge>
            <Badge>{artifact.status}</Badge>
          </>
        }
      >
        {artifact.methods}
      </PageHeader>

      <div className="split">
        <Section title="Details">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Context</th>
                <td>{artifact.population_or_context || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Size</th>
                <td>{artifact.sample_size || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Endpoints</th>
                <td>{artifact.endpoint_categories?.join(", ") || "Unspecified"}</td>
              </tr>
              {applicabilityFacets.map((facet) => (
                <tr key={facet.id}>
                  <th>{facet.label}</th>
                  <td>{facet.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Scope">
          {nodes.length ? (
            <div className="list">
              {nodes.map((node) => (
                <Link className="row-link" href={`/scope/${node.id}`} key={node.id}>
                  <span>
                    <strong>{node.name}</strong>
                    <span className="row-kicker">{node.node_type}</span>
                  </span>
                  <Badge>{node.id}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No linked scope units.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Sources">
        {sources.length ? (
          <div className="list">
            {sources.map((source) => (
              <Link className="row-link" href={`/sources/${source.id}`} key={source.id}>
                <span>
                  <strong>{source.name}</strong>
                  <span className="row-kicker">{source.summary}</span>
                </span>
                <Badge>{source.source_type}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No linked sources.</EmptyState>
        )}
      </Section>

      <Section title="Findings">
        {findings.length ? (
          <div className="list">
            {findings.map((finding) => (
              <Link className="row-link" href={`/findings/${finding.id}`} key={finding.id}>
                <span>
                  <strong>{finding.name}</strong>
                  <span className="row-kicker">{finding.statement}</span>
                </span>
                <Badge>{finding.confidence}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No linked findings.</EmptyState>
        )}
      </Section>
    </main>
  );
}
