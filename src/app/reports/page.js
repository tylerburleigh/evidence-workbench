import { Archive, FileText, FlaskConical, Layers } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, Metric, PageHeader, Section } from "../components.js";
import {
  getSynthesisMatrixConfig,
  getSynthesisMatrixRows,
  getWorkbenchData
} from "../../lib/public-data.js";

export default async function ReportsPage() {
  const data = await getWorkbenchData();
  const config = getSynthesisMatrixConfig(data);
  const rows = getSynthesisMatrixRows(data);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Reports"
        title={config?.title ?? "Reports"}
        aside={config ? <Badge tone="info">{config.row_source}</Badge> : <Badge>No matrix configured</Badge>}
      >
        {config?.description ??
          "Reports are generated from published source, artifact, finding, and claim records for the active domain."}
      </PageHeader>

      <div className="metrics">
        <Metric icon={Archive} label="Sources" value={data.collections.sources.length} />
        <Metric icon={FileText} label="Artifacts" value={data.collections.artifacts.length} />
        <Metric icon={FlaskConical} label="Findings" value={data.collections.findings.length} />
        <Metric icon={Layers} label="Claims" value={data.collections.claims.length} />
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
        <div className="grid three">
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
        </div>
      </Section>
    </main>
  );
}
