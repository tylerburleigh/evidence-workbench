import { FileText } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section } from "../components.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function ArtifactsPage() {
  const data = await getWorkbenchData();
  const artifacts = data.collections.artifacts.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Artifacts" />
      <Section title="Artifacts" note={`${artifacts.length} published`}>
        {artifacts.length ? (
          <div className="grid two">
            {artifacts.map((artifact) => (
              <RecordCard
                key={artifact.id}
                href={`/artifacts/${artifact.id}`}
                icon={FileText}
                title={artifact.name}
                body={artifact.methods}
                meta={
                  <>
                    <Badge>{artifact.artifact_type}</Badge>
                    <Badge>{artifact.status}</Badge>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published artifacts for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
