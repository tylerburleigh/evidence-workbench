import { FileText } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section } from "../components.js";
import { getWorkbenchData } from "../../lib/public-data.js";

export default async function ClaimsPage() {
  const data = await getWorkbenchData();
  const claims = data.collections.claims.map(({ record }) => record).sort((left, right) => left.name.localeCompare(right.name));

  return (
    <main className="page">
      <PageHeader eyebrow="Public Records" title="Claims" />
      <Section title="Claims" note={`${claims.length} published`}>
        {claims.length ? (
          <div className="grid two">
            {claims.map((claim) => (
              <RecordCard
                key={claim.id}
                href={`/claims/${claim.id}`}
                icon={FileText}
                title={claim.name}
                body={claim.summary}
                meta={
                  <>
                    <Badge>{claim.current_stage}</Badge>
                    <Badge>{claim.confidence}</Badge>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState>No published claims for this domain.</EmptyState>
        )}
      </Section>
    </main>
  );
}
