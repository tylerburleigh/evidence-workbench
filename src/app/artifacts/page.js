import { PageHeader, Section } from "../components.js";
import { optionList } from "../index-options.js";
import { RecordIndex } from "../record-index.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function ArtifactsPage() {
  const data = await getWorkbenchData();
  const artifacts = data.collections.artifacts.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));
  const items = artifacts.map((artifact) => ({
    id: artifact.id,
    href: `/artifacts/${artifact.id}`,
    icon: "FileText",
    title: artifact.name,
    body: artifact.methods,
    badges: [{ label: artifact.artifact_type }, { label: artifact.status }],
    filterValues: {
      type: artifact.artifact_type,
      status: artifact.status,
      endpoint: artifact.endpoint_categories ?? []
    },
    searchText: [
      artifact.name,
      artifact.id,
      artifact.artifact_type,
      artifact.status,
      artifact.methods,
      artifact.population_or_context,
      artifact.sample_size,
      ...(artifact.source_ids ?? []),
      ...(artifact.taxonomy_node_ids ?? []),
      ...(artifact.endpoint_categories ?? [])
    ].join(" "),
    sortValues: {
      name: artifact.name,
      type: artifact.artifact_type,
      status: artifact.status
    }
  }));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Artifacts" />
      <Section title="Artifacts" note={`${artifacts.length} published`}>
        <RecordIndex
          emptyMessage="No published artifacts match the current filters."
          filters={[
            { id: "type", label: "Type", options: optionList(artifacts, (artifact) => artifact.artifact_type) },
            { id: "status", label: "Status", options: optionList(artifacts, (artifact) => artifact.status) },
            { id: "endpoint", label: "Endpoint", options: optionList(artifacts, (artifact) => artifact.endpoint_categories ?? []) }
          ]}
          items={items}
          sortOptions={[
            { id: "name", label: "Name" },
            { id: "type", label: "Type" },
            { id: "status", label: "Status" }
          ]}
        />
      </Section>
    </main>
  );
}
