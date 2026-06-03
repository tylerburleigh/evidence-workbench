import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, ExternalSourceLink, PageHeader, Section, SourceAccessBadge } from "../../components.js";
import { getSourceById, getWorkbenchData } from "../../../lib/public-data.js";

export default async function SourceDetailPage({ params }) {
  const { sourceId } = await params;
  const data = await getWorkbenchData();
  const source = getSourceById(data, sourceId);
  if (!source) {
    notFound();
  }

  const findings = data.collections.findings.map(({ record }) => record).filter((finding) => finding.source_id === source.id);
  const artifacts = data.collections.artifacts
    .map(({ record }) => record)
    .filter((artifact) => (artifact.source_ids ?? []).includes(source.id));

  return (
    <main className="page">
      <PageHeader
        eyebrow="Source"
        title={source.name}
        aside={
          <>
            <Badge>{source.source_type}</Badge>
            {source.year ? <Badge>{source.year}</Badge> : null}
            <SourceAccessBadge source={source} />
          </>
        }
      >
        {source.summary}
      </PageHeader>

      <div className="split">
        <Section title="Metadata">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Authors</th>
                <td>{source.authors?.join(", ") || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Venue</th>
                <td>{source.venue || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Published</th>
                <td>{source.published_on || source.year || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Access</th>
                <td><ExternalSourceLink source={source} /></td>
              </tr>
              <tr>
                <th>Access Status</th>
                <td>
                  <span className="meta-row">
                    <SourceAccessBadge source={source} />
                    {source.access_status ? <Badge>{source.access_status.replaceAll("_", " ")}</Badge> : null}
                    {source.access_depth ? <Badge>{source.access_depth.replaceAll("_", " ")}</Badge> : null}
                  </span>
                </td>
              </tr>
              {source.access_attempts?.length ? (
                <tr>
                  <th>Access Attempts</th>
                  <td>
                    <div className="list">
                      {source.access_attempts.map((attempt, index) => (
                        <span key={`${attempt.url ?? "attempt"}-${index}`}>
                          {attempt.attempted_at?.slice(0, 10) ?? "Undated"}: {attempt.result}
                          {attempt.notes ? ` - ${attempt.notes}` : ""}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Section>

        <Section title="Artifacts">
          {artifacts.length ? (
            <div className="list">
              {artifacts.map((artifact) => (
                <Link className="row-link" href={`/artifacts/${artifact.id}`} key={artifact.id}>
                  <span>
                    <strong>{artifact.name}</strong>
                    <span className="row-kicker">{artifact.methods}</span>
                  </span>
                  <Badge>{artifact.artifact_type}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState>No linked artifacts.</EmptyState>
          )}
        </Section>
      </div>

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
