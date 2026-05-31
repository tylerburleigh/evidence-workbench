import { Archive } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section } from "../components.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function SourcesPage() {
  const data = await getWorkbenchData();
  const sources = data.collections.sources.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Sources" />
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
