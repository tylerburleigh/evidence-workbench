import { Archive, Download, FileText, FlaskConical, Layers, SearchCheck } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, Metric, PageHeader, Section } from "../components.js";
import {
  getSynthesisMatrixConfig,
  getSynthesisMatrixRows,
  getSearchProtocols,
  getWorkbenchData
} from "../../lib/public-data.js";

export default async function ReportsPage() {
  const data = await getWorkbenchData();
  const config = getSynthesisMatrixConfig(data);
  const rows = getSynthesisMatrixRows(data);
  const protocols = getSearchProtocols(data);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Reports"
        title={config?.title ?? "Reports"}
        aside={
          config ? (
            <>
              <Badge tone="info">{config.row_source}</Badge>
              <Link className="text-link" href="/reports/matrix.csv">
                <Download size={13} /> CSV
              </Link>
              <Link className="text-link" href="/reports/matrix.md">
                <Download size={13} /> Markdown
              </Link>
            </>
          ) : (
            <Badge>No matrix configured</Badge>
          )
        }
      >
        {config?.description ??
          "Reports are generated from published source, artifact, finding, and claim records for the active domain."}
      </PageHeader>

      <div className="metrics">
        <Metric icon={Archive} label="Sources" value={data.collections.sources.length} />
        <Metric icon={FileText} label="Artifacts" value={data.collections.artifacts.length} />
        <Metric icon={FlaskConical} label="Findings" value={data.collections.findings.length} />
        <Metric icon={Layers} label="Claims" value={data.collections.claims.length} />
        <Metric icon={SearchCheck} label="Protocols" value={protocols.length} />
      </div>

      <Section title="Synthesis Matrix" note={config ? `${rows.length} row(s)` : "Not configured"}>
        {!config ? (
          <EmptyState>No synthesis matrix is configured for this domain.</EmptyState>
        ) : rows.length ? (
          <div className="table-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.id}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {config.columns.map((column, index) => (
                      <td key={column.id}>
                        {index === 0 ? (
                          <Link className="matrix-link" href={row.href}>
                            {row.cells[column.id]}
                          </Link>
                        ) : (
                          row.cells[column.id]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            {config.empty_state ?? data.domainPack.publicCopy.empty_states?.no_synthesis_rows ?? "No report rows yet."}
          </EmptyState>
        )}
      </Section>

      <Section title="Synthesis Inputs">
        <div className="grid four">
          <Link className="card card-link" href="/artifacts">
            <div className="card-title">
              <span>
                <FileText className="icon" size={16} /> Study Artifacts
              </span>
            </div>
            <p className="card-body">Method, context, response-origin, and evaluation setup records.</p>
          </Link>
          <Link className="card card-link" href="/findings">
            <div className="card-title">
              <span>
                <FlaskConical className="icon" size={16} /> Extracted Findings
              </span>
            </div>
            <p className="card-body">Atomic source-backed results that feed synthesis claims.</p>
          </Link>
          <Link className="card card-link" href="/claims">
            <div className="card-title">
              <span>
                <Layers className="icon" size={16} /> Synthesis Claims
              </span>
            </div>
            <p className="card-body">Review-question conclusions with support maps and limitations.</p>
          </Link>
          <div className="card">
            <div className="card-title">
              <span>
                <SearchCheck className="icon" size={16} /> Search Protocols
              </span>
              <Badge>{protocols.length}</Badge>
            </div>
            <p className="card-body">Search query, screening, inclusion, exclusion, and deduplication records.</p>
          </div>
        </div>
      </Section>

      <Section title="Search Protocols" note={`${protocols.length} published`}>
        {protocols.length ? (
          <div className="list">
            {protocols.map((protocol) => (
              <div className="row" key={protocol.id}>
                <span>
                  <strong>{protocol.name}</strong>
                  <span className="row-kicker">{protocol.screening_summary}</span>
                </span>
                <span className="meta-row">
                  <Badge>{protocol.status}</Badge>
                  <Badge>{protocol.search_completed_at?.slice(0, 10) ?? "Undated"}</Badge>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No search protocol records have been published for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
