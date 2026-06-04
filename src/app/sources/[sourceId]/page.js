import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Breadcrumbs,
  EmptyState,
  ExternalSourceLink,
  PageHeader,
  Section,
  SourceAccessBadge,
  StatusBadge
} from "../../components.js";
import {
  claimReferencesFinding,
  getArtifactsForSource,
  getClaimsForSource,
  getFindingsForSource,
  getReportsForSource,
  getSourceById,
  getWorkbenchData
} from "../../../lib/public-data.js";

function UsedInList({ empty, items, renderBadge, renderKicker, type }) {
  if (!items.length) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <div className="list">
      {items.map((item) => (
        <Link className="row-link" href={`/${type}/${item.id}`} key={item.id}>
          <span>
            <strong>{item.name}</strong>
            {renderKicker ? <span className="row-kicker">{renderKicker(item)}</span> : null}
          </span>
          {renderBadge ? renderBadge(item) : null}
        </Link>
      ))}
    </div>
  );
}

export default async function SourceDetailPage({ params }) {
  const { sourceId } = await params;
  const data = await getWorkbenchData();
  const source = getSourceById(data, sourceId);
  if (!source) {
    notFound();
  }

  const findings = getFindingsForSource(data, source.id);
  const artifacts = getArtifactsForSource(data, source.id);
  const claims = getClaimsForSource(data, source.id);
  const reports = getReportsForSource(data, source.id);
  const evidenceChains = findings.map((finding) => ({
    finding,
    claims: claims.filter((claim) => claimReferencesFinding(claim, finding.id))
  }));

  return (
    <main className="page">
      <Breadcrumbs
        items={[
          { href: "/sources", label: "Sources" },
          { label: source.name }
        ]}
      />

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
      />

      <div className="split">
        <Section title="What This Source Is">
          <div className="summary-panel">
            <p>{source.summary || "No source summary has been recorded."}</p>
            <div className="meta-row">
              <Badge>{source.source_type}</Badge>
              {source.year ? <Badge>{source.year}</Badge> : null}
              <SourceAccessBadge source={source} />
            </div>
          </div>
        </Section>

        <Section title="Evidence Use">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Role</th>
                <td>
                  {findings.length
                    ? `Direct source for ${findings.length} finding(s); used by ${claims.length} claim(s).`
                    : `Linked source used by ${claims.length} claim(s).`}
                </td>
              </tr>
              <tr>
                <th>Trace</th>
                <td>
                  <span className="meta-row no-top-margin">
                    <Badge>{artifacts.length} artifact(s)</Badge>
                    <Badge>{findings.length} finding(s)</Badge>
                    <Badge>{claims.length} claim(s)</Badge>
                    <Badge>{reports.length} report(s)</Badge>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      </div>

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

        <Section title="Used In">
          <div className="trace-count-grid">
            <Link className="trace-count" href="#artifacts">
              <strong>{artifacts.length}</strong>
              <span>Artifacts</span>
            </Link>
            <Link className="trace-count" href="#findings">
              <strong>{findings.length}</strong>
              <span>Findings</span>
            </Link>
            <Link className="trace-count" href="#claims">
              <strong>{claims.length}</strong>
              <span>Claims</span>
            </Link>
            <Link className="trace-count" href="#reports">
              <strong>{reports.length}</strong>
              <span>Reports</span>
            </Link>
          </div>
        </Section>
      </div>

      <Section title="Evidence Chains" note={`${evidenceChains.length} chain(s)`}>
        {evidenceChains.length ? (
          <div className="support-list">
            {evidenceChains.map(({ finding, claims: linkedClaims }) => (
              <div className="support-item" key={finding.id}>
                <h3>Source to finding to claim</h3>
                <div className="evidence-chain">
                  <Link className="text-link" href={`/sources/${source.id}`}>
                    {source.name}
                  </Link>
                  <span>{"->"}</span>
                  <Link className="text-link" href={`/findings/${finding.id}`}>
                    {finding.name}
                  </Link>
                  <span>{"->"}</span>
                  {linkedClaims.length ? (
                    <span className="link-list">
                      {linkedClaims.map((claim) => (
                        <Link className="text-link" href={`/claims/${claim.id}`} key={claim.id}>
                          {claim.name}
                        </Link>
                      ))}
                    </span>
                  ) : (
                    <span className="row-kicker no-top-margin">No published claim cites this finding yet.</span>
                  )}
                </div>
                <p>{finding.statement}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No source-backed finding chains for this source.</EmptyState>
        )}
      </Section>

      <div className="split">
        <Section title="Artifacts" note={`${artifacts.length} linked`} id="artifacts">
          <UsedInList
            empty="No linked artifacts."
            items={artifacts}
            renderBadge={(artifact) => <Badge>{artifact.artifact_type}</Badge>}
            renderKicker={(artifact) => artifact.methods}
            type="artifacts"
          />
        </Section>

        <Section title="Findings" note={`${findings.length} linked`} id="findings">
          <UsedInList
            empty="No linked findings."
            items={findings}
            renderBadge={(finding) => <Badge>{finding.confidence}</Badge>}
            renderKicker={(finding) => finding.statement}
            type="findings"
          />
        </Section>
      </div>

      <div className="split">
        <Section title="Claims" note={`${claims.length} linked`} id="claims">
          <UsedInList
            empty="No linked claims."
            items={claims}
            renderBadge={(claim) => (
              <span className="meta-row no-top-margin">
                <Badge>{claim.current_stage}</Badge>
                <Badge>{claim.confidence}</Badge>
              </span>
            )}
            renderKicker={(claim) => claim.summary}
            type="claims"
          />
        </Section>

        <Section title="Reports" note={`${reports.length} linked`} id="reports">
          <UsedInList
            empty="No linked reports."
            items={reports}
            renderBadge={(report) => <StatusBadge status={report.status ?? "current"} />}
            renderKicker={(report) => report.summary}
            type="reports"
          />
        </Section>
      </div>
    </main>
  );
}
