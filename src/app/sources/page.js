import { PageHeader, Section } from "../components.js";
import { optionList } from "../index-options.js";
import { RecordIndex } from "../record-index.js";
import { getSourceAccessInfo, getSourceAccessSummary, getStudioData } from "../../lib/public-data.js";

export default async function SourcesPage() {
  const data = await getStudioData();
  const sources = data.collections.sources.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
  const accessSummary = getSourceAccessSummary(data);
  const items = sources.map((source) => {
    const access = getSourceAccessInfo(source);
    return {
      id: source.id,
      href: `/sources/${source.id}`,
      icon: "Archive",
      title: source.name,
      body: source.summary,
      badges: [
        { label: source.source_type },
        ...(source.year ? [{ label: String(source.year) }] : []),
        { label: access.label, tone: access.tone }
      ],
      filterValues: {
        type: source.source_type,
        access: access.category,
        year: source.year ? String(source.year) : "undated"
      },
      searchText: [
        source.name,
        source.id,
        source.summary,
        source.source_type,
        source.year,
        source.published_on,
        source.venue,
        source.doi,
        access.label,
        ...(source.authors ?? [])
      ].join(" "),
      sortValues: {
        name: source.name,
        year: source.year ?? 0,
        type: source.source_type,
        access: access.label
      }
    };
  });

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
        <RecordIndex
          emptyMessage="No linked public sources match the current filters."
          filters={[
            { id: "type", label: "Type", options: optionList(sources, (source) => source.source_type) },
            {
              id: "access",
              label: "Access",
              options: optionList(
                sources,
                (source) => getSourceAccessInfo(source).category,
                (value) => {
                  const match = sources.find((source) => getSourceAccessInfo(source).category === value);
                  return getSourceAccessInfo(match).label;
                }
              )
            },
            { id: "year", label: "Year", options: optionList(sources, (source) => (source.year ? String(source.year) : "undated")) }
          ]}
          items={items}
          sortOptions={[
            { id: "name", label: "Name" },
            { id: "year", label: "Newest", direction: "desc" },
            { id: "type", label: "Type" },
            { id: "access", label: "Access" }
          ]}
        />
      </Section>
    </main>
  );
}
