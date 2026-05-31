import { FlaskConical } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section } from "../components.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function FindingsPage() {
  const data = await getWorkbenchData();
  const findings = data.collections.findings.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Findings" />
      <Section title="Findings" note={`${findings.length} published`}>
        {findings.length ? (
          <div className="grid two">
            {findings.map((finding) => (
              <RecordCard
                key={finding.id}
                href={`/findings/${finding.id}`}
                icon={FlaskConical}
                title={finding.name}
                body={finding.statement}
                meta={
                  <>
                    <Badge>{finding.evidence_tier}</Badge>
                    <Badge>{finding.confidence}</Badge>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published findings for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
