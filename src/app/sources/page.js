import { Archive } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section, SourceAccessBadge } from "../components.js";
import { getSourceAccessSummary, getWorkbenchData } from "../../lib/public-data.js";

export default async function SourcesPage() {
  const data = await getWorkbenchData();
  const sources = data.collections.sources.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
  const accessSummary = getSourceAccessSummary(data);

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Sources" />
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Full text</div>
          <div className="metric-value">{accessSummary.categories.full_text}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Abstract only</div>
          <div className="metric-value">{accessSummary.categories.abstract_only}</div>
        </div>
        <div className="metric">
          <div className="metric-label">No full text</div>
          <div className="metric-value">{accessSummary.categories.no_full_text}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Metadata only</div>
          <div className="metric-value">{accessSummary.categories.metadata_only}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Not checked</div>
          <div className="metric-value">{accessSummary.categories.not_checked}</div>
        </div>
      </div>
      <Section title="Sources" note={`${sources.length} linked`}>
        {sources.length ? (
          <div className="grid two">
            {sources.map((source) => (
              <RecordCard
                key={source.id}
                href={`/sources/${source.id}`}
                icon={Archive}
                title={source.name}
                body={source.summary}
                meta={
                  <>
                    <Badge>{source.source_type}</Badge>
                    {source.year ? <Badge>{source.year}</Badge> : null}
                    <SourceAccessBadge source={source} />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No linked public sources for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
