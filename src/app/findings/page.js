import { PageHeader, Section } from "../components.js";
import { optionList } from "../index-options.js";
import { RecordIndex } from "../record-index.js";
import { getStudioData } from "../../lib/public-data.js";

export default async function FindingsPage() {
  const data = await getStudioData();
  const findings = data.collections.findings.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
  const items = findings.map((finding) => ({
    id: finding.id,
    href: `/findings/${finding.id}`,
    icon: "FlaskConical",
    title: finding.name,
    body: finding.statement,
    badges: [{ label: finding.evidence_tier }, { label: finding.confidence }],
    filterValues: {
      tier: finding.evidence_tier,
      confidence: finding.confidence,
      direction: finding.direction,
      endpoint: finding.endpoint_category
    },
    searchText: [
      finding.name,
      finding.id,
      finding.statement,
      finding.source_id,
      finding.artifact_id,
      finding.endpoint_category,
      finding.direction,
      finding.evidence_tier,
      finding.confidence,
      finding.population_or_context,
      finding.quantitative_note,
      ...(finding.caveats ?? [])
    ].join(" "),
    sortValues: {
      name: finding.name,
      confidence: finding.confidence,
      direction: finding.direction,
      endpoint: finding.endpoint_category,
      tier: finding.evidence_tier
    }
  }));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Findings" />
      <Section title="Findings" note={`${findings.length} published`}>
        <RecordIndex
          emptyMessage="No published findings match the current filters."
          filters={[
            { id: "tier", label: "Evidence Tier", options: optionList(findings, (finding) => finding.evidence_tier) },
            { id: "confidence", label: "Confidence", options: optionList(findings, (finding) => finding.confidence) },
            { id: "direction", label: "Direction", options: optionList(findings, (finding) => finding.direction) }
          ]}
          items={items}
          sortOptions={[
            { id: "name", label: "Name" },
            { id: "confidence", label: "Confidence" },
            { id: "endpoint", label: "Endpoint" },
            { id: "tier", label: "Evidence tier" }
          ]}
        />
      </Section>
    </main>
  );
}
