import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, PageHeader, Section } from "../../components.js";
import {
  getClaimById,
  getNodeById,
  getReportArtifactById,
  getReportArtifactMarkdown,
  getSourceById,
  getWorkbenchData
} from "../../../lib/public-data.js";
import { MarkdownReport } from "./markdown-report.js";

export default async function ReportArtifactPage({ params }) {
  const { reportId } = await params;
  const data = await getWorkbenchData();
  const report = getReportArtifactById(data, reportId);

  if (!report) {
    notFound();
  }

  const markdown = await getReportArtifactMarkdown(report);
  const scopeNodes = (report.scope_ids ?? []).map((nodeId) => getNodeById(data, nodeId)).filter(Boolean);
  const sources = (report.source_ids ?? []).map((sourceId) => getSourceById(data, sourceId)).filter(Boolean);
  const claims = (report.claim_ids ?? []).map((claimId) => getClaimById(data, claimId)).filter(Boolean);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Report Artifact"
        title={report.name}
        aside={
          <>
            <Badge>{report.artifact_type}</Badge>
            <Badge>{report.status ?? "current"}</Badge>
            <Badge>{report.created_at}</Badge>
          </>
        }
      >
        {report.summary}
      </PageHeader>

      <div className="split">
        <Section title="Report">
          <MarkdownReport markdown={markdown} />
        </Section>

        <Section title="Traceability">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Path</th>
                <td className="path-value">{report.path}</td>
              </tr>
              <tr>
                <th>Citation Audit</th>
                <td>{report.citation_audit?.status ?? "not_checked"}</td>
              </tr>
              <tr>
                <th>Audit Method</th>
                <td>{report.citation_audit?.method ?? "Unspecified"}</td>
              </tr>
              <tr>
                <th>Scope</th>
                <td>
                  {scopeNodes.length ? (
                    <div className="link-list">
                      {scopeNodes.map((node) => (
                        <Link className="text-link" href={`/scope/${node.id}`} key={node.id}>
                          {node.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    "Unspecified"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      </div>

      <Section title="Linked Sources" note={`${sources.length} source(s)`}>
        {sources.length ? (
          <div className="list">
            {sources.map((source) => (
              <Link className="row-link" href={`/sources/${source.id}`} key={source.id}>
                <span>
                  <strong>{source.name}</strong>
                  <span className="row-kicker">{source.id}</span>
                </span>
                <Badge>{source.year ?? "Undated"}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No linked sources.</EmptyState>
        )}
      </Section>

      <Section title="Linked Claims" note={`${claims.length} claim(s)`}>
        {claims.length ? (
          <div className="list">
            {claims.map((claim) => (
              <Link className="row-link" href={`/claims/${claim.id}`} key={claim.id}>
                <span>
                  <strong>{claim.name}</strong>
                  <span className="row-kicker">{claim.id}</span>
                </span>
                <Badge>{claim.confidence}</Badge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No linked claims.</EmptyState>
        )}
      </Section>
    </main>
  );
}
