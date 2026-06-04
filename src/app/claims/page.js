import { PageHeader, Section } from "../components.js";
import { optionList } from "../index-options.js";
import { RecordIndex } from "../record-index.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function ClaimsPage() {
  const data = await getWorkbenchData();
  const claims = data.collections.claims.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
  const items = claims.map((claim) => ({
    id: claim.id,
    href: `/claims/${claim.id}`,
    icon: "FileText",
    title: claim.name,
    body: claim.summary,
    badges: [{ label: claim.current_stage }, { label: claim.confidence }],
    filterValues: {
      stage: claim.current_stage,
      confidence: claim.confidence
    },
    searchText: [
      claim.name,
      claim.id,
      claim.summary,
      claim.current_stage,
      claim.confidence,
      claim.momentum,
      ...(claim.limitations ?? []),
      ...(claim.best_current_signals ?? [])
    ].join(" "),
    sortValues: {
      name: claim.name,
      updated: claim.last_updated ?? "",
      confidence: claim.confidence,
      stage: claim.current_stage
    }
  }));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Claims" />
      <Section title="Claims" note={`${claims.length} published`}>
        <RecordIndex
          emptyMessage="No published claims match the current filters."
          filters={[
            { id: "stage", label: "Stage", options: optionList(claims, (claim) => claim.current_stage) },
            { id: "confidence", label: "Confidence", options: optionList(claims, (claim) => claim.confidence) }
          ]}
          items={items}
          sortOptions={[
            { id: "name", label: "Name" },
            { id: "updated", label: "Recently updated", direction: "desc" },
            { id: "confidence", label: "Confidence" },
            { id: "stage", label: "Stage" }
          ]}
        />
      </Section>
    </main>
  );
}
