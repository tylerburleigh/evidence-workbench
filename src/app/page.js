import { Archive, BookOpen, CheckCircle2, FileText, FlaskConical, Layers, Network } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  RecordCard,
  ReviewGateBadge,
  Section,
  StatusBadge
} from "./components.js";
import {
  formatDate,
  getOpenBundleCount,
  getPublishedCount,
  getReportArtifacts,
  getScopeNodes,
  getScopePluralLabel,
  getWorkbenchData
} from "../lib/public-data.js";

export default async function HomePage() {
  const data = await getWorkbenchData();
  const scopeNodes = getScopeNodes(data);
  const scopePlural = getScopePluralLabel(data);
  const reportArtifacts = getReportArtifacts(data);
  const literatureReview = reportArtifacts.find((report) => report.artifact_type === "literature_review");
  const supportingReports = reportArtifacts.filter((report) => report.id !== literatureReview?.id).slice(0, 3);
  const latestBundles = data.collections.candidateBundles
    .map(({ record }) => record)
    .sort((left, right) => right.submitted_at.localeCompare(left.submitted_at))
    .slice(0, 4);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Evidence Workbench"
        title={data.domainPack.domain.name}
        aside={<Badge tone="info">{data.domainPack.domain.default_scope_unit}</Badge>}
      >
        {data.domainPack.domain.summary}
      </PageHeader>

      <div className="metrics">
        <Metric icon={Network} label={scopePlural} value={scopeNodes.length} />
        <Metric icon={FileText} label="Published claims" value={data.collections.claims.length} />
        <Metric icon={Archive} label="Sources" value={data.collections.sources.length} />
        <Metric icon={CheckCircle2} label="Published bundles" value={getPublishedCount(data)} />
      </div>

      <div className="split">
        <Section title="Current Literature Review" note={literatureReview ? "Manuscript-facing synthesis" : "Not indexed"}>
          {literatureReview ? (
            <RecordCard
              href={`/reports/${literatureReview.id}`}
              icon={BookOpen}
              title={literatureReview.name}
              body={literatureReview.summary}
              meta={
                <>
                  <Badge>{literatureReview.artifact_type}</Badge>
                  <Badge>{literatureReview.citation_audit?.status ?? "not_checked"}</Badge>
                </>
              }
            />
          ) : (
            <EmptyState>No current literature review is indexed for this domain.</EmptyState>
          )}
        </Section>

        <Section title="Related Outputs">
          <div className="list">
            {supportingReports.map((report) => (
              <Link className="row-link" href={`/reports/${report.id}`} key={report.id}>
                <span>
                  <strong>{report.name}</strong>
                  <span className="row-kicker">{report.summary}</span>
                </span>
                <span className="meta-row">
                  <Badge>{report.artifact_type}</Badge>
                </span>
              </Link>
            ))}
            <Link className="row-link" href="/artifacts">
              <span>
                <strong>Study Artifacts</strong>
                <span className="row-kicker">Extracted study, framework, and technical-report records.</span>
              </span>
              <span className="meta-row">
                <Badge>
                  <FlaskConical size={13} /> {data.collections.artifacts.length}
                </Badge>
              </span>
            </Link>
          </div>
        </Section>
      </div>

      <div className="split">
        <Section title={`${scopePlural} Coverage`} note={`${getOpenBundleCount(data)} active bundle(s)`}>
          {scopeNodes.length ? (
            <div className="grid two">
              {scopeNodes.map((node) => {
                const coverage = data.planning.coverageStatus?.nodes?.find((row) => row.taxonomy_node_id === node.id);
                return (
                  <RecordCard
                    key={node.id}
                    href={`/scope/${node.id}`}
                    icon={Layers}
                    title={node.name}
                    body={node.summary}
                    meta={<StatusBadge status={coverage?.coverage_status ?? "not_started"} />}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState>No configured scope units.</EmptyState>
          )}
        </Section>

        <Section title="Recent Bundles">
          {latestBundles.length ? (
            <div className="list">
              {latestBundles.map((bundle) => {
                const report = data.bundleReports.find((item) => item.bundle_id === bundle.id);
                return (
                  <div className="row" key={bundle.id}>
                    <span>
                      <strong>{bundle.name}</strong>
                      <span className="row-kicker">{formatDate(bundle.submitted_at)}</span>
                    </span>
                    <span className="meta-row">
                      <StatusBadge status={bundle.lifecycle_status} />
                      <ReviewGateBadge report={report} />
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>No bundles for this domain.</EmptyState>
          )}
        </Section>
      </div>

      <Section title="Published Claims">
        {data.collections.claims.length ? (
          <div className="grid three">
            {data.collections.claims.map(({ record }) => (
              <RecordCard
                key={record.id}
                href={`/claims/${record.id}`}
                title={record.name}
                body={record.summary}
                meta={
                  <>
                    <Badge>{record.current_stage}</Badge>
                    <Badge>{record.confidence}</Badge>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published claims for this domain.</EmptyState>
        )}
      </Section>

      <Section title="Record Index">
        <div className="link-list">
          <Link className="nav-link" href="/scope">
            {scopePlural}
          </Link>
          <Link className="nav-link" href="/claims">
            Claims
          </Link>
          <Link className="nav-link" href="/findings">
            Findings
          </Link>
          <Link className="nav-link" href="/sources">
            Sources
          </Link>
          <Link className="nav-link" href="/artifacts">
            Artifacts
          </Link>
          <Link className="nav-link" href="/activity">
            Activity
          </Link>
          <Link className="nav-link" href="/reports">
            Reports
          </Link>
          <Link className="nav-link" href="/methods">
            Methods
          </Link>
          <Link className="nav-link" href="/admin/review">
            Review
          </Link>
        </div>
      </Section>
    </main>
  );
}
