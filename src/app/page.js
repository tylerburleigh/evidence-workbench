import { Archive, CheckCircle2, FileText, Layers, Network } from "lucide-react";
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
  getScopeNodes,
  getScopePluralLabel,
  getWorkbenchData
} from "../lib/public-data.js";

export default async function HomePage() {
  const data = await getWorkbenchData();
  const scopeNodes = getScopeNodes(data);
  const scopePlural = getScopePluralLabel(data);
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
