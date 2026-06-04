import { Activity, Archive, CalendarClock, ClipboardList, FileText } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  ReviewGateBadge,
  Section,
  StatusBadge
} from "../components.js";
import { formatDate, getActivityFeed, getStudioData } from "../../lib/public-data.js";

function targetHref(target) {
  if (target.record_type === "claim") {
    return `/claims/${target.record_id}`;
  }
  if (target.record_type === "finding") {
    return `/findings/${target.record_id}`;
  }
  if (target.record_type === "artifact") {
    return `/artifacts/${target.record_id}`;
  }
  if (target.record_type === "source") {
    return `/sources/${target.record_id}`;
  }

  return undefined;
}

export default async function ActivityPage() {
  const data = await getStudioData();
  const feed = getActivityFeed(data);
  const publishedEvents = data.collections.publicationEvents.length;
  const bundleReports = new Map(data.bundleReports.map((report) => [report.bundle_id, report]));

  return (
    <main className="page">
      <PageHeader eyebrow="Activity" title="Public Change Feed" aside={<Badge tone="info">Operational History</Badge>}>
        Activity records explain what changed and when. They are separated from evidence so publication history is not
        mistaken for proof.
      </PageHeader>

      <div className="metrics">
        <Metric icon={Activity} label="Activity entries" value={feed.length} />
        <Metric icon={Archive} label="Publication events" value={publishedEvents} />
        <Metric icon={ClipboardList} label="Candidate bundles" value={data.collections.candidateBundles.length} />
        <Metric icon={FileText} label="Published claims" value={data.collections.claims.length} />
      </div>

      <Section title="Activity Is Not Evidence">
        <div className="card">
          <p className="card-body no-top-margin">
            Use activity to audit workflow changes. Use claim support maps, findings, artifacts, and sources to inspect
            the evidence basis.
          </p>
        </div>
      </Section>

      <Section title="Timeline" note={`${feed.length} event(s)`}>
        {feed.length ? (
          <div className="timeline">
            {feed.map((item) => {
              const report = item.bundle ? bundleReports.get(item.bundle.id) : undefined;
              return (
                <article className="timeline-item" key={item.id}>
                  <div className="timeline-marker">
                    <CalendarClock size={15} />
                  </div>
                  <div className="card">
                    <div className="card-title">
                      <span>{item.title}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="card-body">{item.summary}</p>
                    <div className="meta-row">
                      <Badge>{formatDate(item.timestamp)}</Badge>
                      <Badge>{item.type}</Badge>
                      <ReviewGateBadge report={report} />
                    </div>
                    {item.bundle?.scope?.research_question ? (
                      <p className="row-kicker timeline-question">{item.bundle.scope.research_question}</p>
                    ) : null}
                    {item.targets?.length ? (
                      <div className="activity-targets">
                        {item.targets.slice(0, 6).map((target) => {
                          const href = targetHref(target);
                          const label = `${target.action ?? target.change_type ?? "changed"} ${target.record_type ?? target.target_record_type}`;
                          const key = `${target.record_id ?? target.target_record_id}-${label}`;
                          return href ? (
                            <Link className="badge" href={href} key={key}>
                              {label}
                            </Link>
                          ) : (
                            <Badge key={key}>{label}</Badge>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState>No activity has been published for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
