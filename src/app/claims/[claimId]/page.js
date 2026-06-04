import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Breadcrumbs, EmptyState, PageHeader, Section, SourceAccessBadge, SupportMap } from "../../components.js";
import {
  getApplicabilityFacetEntries,
  getClaimById,
  getFindingById,
  getNodeById,
  getSourceById,
  getWorkbenchData
} from "../../../lib/public-data.js";

export default async function ClaimDetailPage({ params }) {
  const { claimId } = await params;
  const data = await getWorkbenchData();
  const claim = getClaimById(data, claimId);
  if (!claim) {
    notFound();
  }

  const subject = claim.subject_type === "taxonomy_node" ? getNodeById(data, claim.subject_id) : undefined;
  const findings = (claim.supporting_finding_ids ?? []).map((id) => getFindingById(data, id)).filter(Boolean);
  const sources = (claim.supporting_source_ids ?? []).map((id) => getSourceById(data, id)).filter(Boolean);
  const applicabilityFacets = getApplicabilityFacetEntries(data, claim, "claim");

  return (
    <main className="page">
      <Breadcrumbs
        items={[
          { href: "/claims", label: "Claims" },
          ...(subject ? [{ href: `/scope/${subject.id}`, label: subject.name }] : []),
          { label: claim.name }
        ]}
      />

      <PageHeader
        eyebrow={subject?.name ?? claim.subject_type}
        title={claim.name}
        aside={
          <>
            <Badge>{claim.current_stage}</Badge>
            <Badge>{claim.confidence}</Badge>
          </>
        }
      >
        {claim.summary}
      </PageHeader>

      <div className="split">
        <Section title="Support Map">
          {claim.supporting_evidence?.length ? (
            <div className="support-list">
              {claim.supporting_evidence.map((support) => (
                <SupportMap findings={findings} key={support.label} sources={sources} support={support} />
              ))}
            </div>
          ) : (
            <EmptyState>No support map entries.</EmptyState>
          )}
        </Section>

        <Section title="Claim Details">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Subject</th>
                <td>{subject ? <Link className="text-link" href={`/scope/${subject.id}`}>{subject.name}</Link> : claim.subject_id}</td>
              </tr>
              <tr>
                <th>Momentum</th>
                <td>{claim.momentum}</td>
              </tr>
              <tr>
                <th>Updated</th>
                <td>{claim.last_updated}</td>
              </tr>
              <tr>
                <th>Limitations</th>
                <td>{claim.limitations?.join("; ") || "Unspecified"}</td>
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
      </div>

      {claim.applicability ? (
        <Section title="Applicability">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>Applies When</th>
                <td>{claim.applicability.applies_when?.join("; ") || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Does Not Apply When</th>
                <td>{claim.applicability.does_not_apply_when?.join("; ") || "Unspecified"}</td>
              </tr>
              <tr>
                <th>Unreviewed Contexts</th>
                <td>{claim.applicability.unknown_or_unreviewed_contexts?.join("; ") || "Unspecified"}</td>
              </tr>
            </tbody>
          </table>
        </Section>
      ) : null}

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

      <Section title="Sources">
        {sources.length ? (
          <div className="list">
            {sources.map((source) => (
              <Link className="row-link" href={`/sources/${source.id}`} key={source.id}>
                <span>
                  <strong>{source.name}</strong>
                  <span className="row-kicker">{source.summary}</span>
                </span>
                <span className="meta-row">
                  <Badge>{source.source_type}</Badge>
                  <SourceAccessBadge source={source} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No linked sources.</EmptyState>
        )}
      </Section>
    </main>
  );
}
