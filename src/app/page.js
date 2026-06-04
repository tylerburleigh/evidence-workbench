import {
  Activity,
  Archive,
  BookOpen,
  CheckCircle2,
  FileText,
  FlaskConical,
  Layers,
  Network,
  SearchCheck,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  RecordCard,
  AppraisalGateBadge,
  Section,
  StatusBadge
} from "./components.js";
import {
  formatDate,
  getActivityFeed,
  getAttentionItems,
  getCoverageSnapshot,
  getEvidenceHealth,
  getOpenBundleCount,
  getPublishedCount,
  getReportArtifacts,
  getScopeNodes,
  getScopePluralLabel,
  getStudioData
} from "../lib/public-data.js";

function attentionTone(severity) {
  return severity === "danger" ? "danger" : severity === "warn" ? "warn" : severity === "info" ? "info" : "neutral";
}

function attentionIcon(severity) {
  return severity === "warn" || severity === "danger" ? TriangleAlert : SearchCheck;
}

function activityHref(item) {
  if (item.bundle) {
    return `/admin/review/${item.bundle.id}`;
  }

  const target = item.targets?.[0];
  if (target?.record_type === "claim") {
    return `/claims/${target.record_id}`;
  }
  if (target?.record_type === "finding") {
    return `/findings/${target.record_id}`;
  }
  if (target?.record_type === "artifact") {
    return `/artifacts/${target.record_id}`;
  }
  if (target?.record_type === "source") {
    return `/sources/${target.record_id}`;
  }

  return "/activity";
}

export default async function HomePage() {
  const data = await getStudioData();
  const scopeNodes = getScopeNodes(data);
  const scopePlural = getScopePluralLabel(data);
  const attentionItems = getAttentionItems(data).slice(0, 6);
  const coverageSnapshot = getCoverageSnapshot(data);
  const evidenceHealth = getEvidenceHealth(data);
  const recentActivity = getActivityFeed(data).slice(0, 4);
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
        eyebrow="Lit Review Studio"
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

      <Section title="Needs Attention Now" note={`${attentionItems.length} active signal(s)`}>
        {attentionItems.length ? (
          <div className="list">
            {attentionItems.map((item) => {
              const Icon = attentionIcon(item.severity);
              return (
                <Link className="row-link attention-row" href={item.href} key={item.id}>
                  <span>
                    <strong>
                      <Icon className="icon" size={15} /> {item.title}
                    </strong>
                    <span className="row-kicker">{item.body}</span>
                  </span>
                  <span className="meta-row">
                    <Badge tone={attentionTone(item.severity)}>{item.label}</Badge>
                    {item.meta.map((meta) => (
                      <Badge key={`${item.id}-${meta}`}>{meta}</Badge>
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState>No active attention signals for this domain.</EmptyState>
        )}
      </Section>

      <div className="split">
        <Section title="Coverage Snapshot" note={`${scopeNodes.length} ${scopePlural.toLowerCase()}`}>
          {coverageSnapshot.length ? (
            <div className="coverage-groups">
              {coverageSnapshot.map(({ status, nodes }) => (
                <div className="coverage-group" key={status}>
                  <div className="coverage-group-head">
                    <StatusBadge status={status} />
                    <Badge>{nodes.length}</Badge>
                  </div>
                  <div className="link-list">
                    {nodes.slice(0, 6).map(({ node }) => (
                      <Link className="text-link" href={`/scope/${node.id}`} key={node.id}>
                        {node.name}
                      </Link>
                    ))}
                    {nodes.length > 6 ? <Badge>{nodes.length - 6} more</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No configured coverage state.</EmptyState>
          )}
        </Section>

        <Section title="Evidence Health">
          <div className="grid two compact-health-grid">
            <Metric icon={Archive} label="Direct full text" value={evidenceHealth.directFullTextRatio} />
            <Metric icon={TriangleAlert} label="Access-limited direct" value={evidenceHealth.sourceAccess.direct_finding_sources.access_limited} />
            <Metric icon={FileText} label="Summary gaps" value={evidenceHealth.missingSummaries.length} />
            <Metric icon={ShieldCheck} label="Thin claims" value={evidenceHealth.thinClaims.length} />
          </div>
        </Section>
      </div>

      <Section title="Recent Changes" note={`${recentActivity.length} latest`}>
        {recentActivity.length ? (
          <div className="list">
            {recentActivity.map((item) => (
              <Link className="row-link" href={activityHref(item)} key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <span className="row-kicker">{item.summary}</span>
                </span>
                <span className="meta-row">
                  <Badge>{formatDate(item.timestamp)}</Badge>
                  <Badge>{item.type}</Badge>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>No recent activity for this domain.</EmptyState>
        )}
      </Section>

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
                      <AppraisalGateBadge report={report} />
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
