import { Layers } from "lucide-react";
import { Badge, EmptyState, PageHeader, RecordCard, Section, StatusBadge } from "../components.js";
import {
  getBundlesForNode,
  getClaimsForNode,
  getFindingsForNode,
  getScopeNodes,
  getScopePluralLabel,
  getWorkbenchData
} from "../../lib/public-data.js";

export default async function TopicsPage() {
  const data = await getWorkbenchData();
  const nodes = getScopeNodes(data);
  const scopePlural = getScopePluralLabel(data);

  return (
    <main className="page">
      <PageHeader eyebrow="Scope Index" title={scopePlural}>
        {data.domainPack.domain.summary}
      </PageHeader>

      <Section title={scopePlural} note={`${nodes.length} configured`}>
        {nodes.length ? (
          <div className="grid two">
            {nodes.map((node) => {
              const coverage = data.planning.coverageStatus?.nodes?.find((row) => row.taxonomy_node_id === node.id);
              const claims = getClaimsForNode(data, node.id);
              const findings = getFindingsForNode(data, node.id);
              const bundles = getBundlesForNode(data, node.id);
              return (
                <RecordCard
                  key={node.id}
                  href={`/scope/${node.id}`}
                  icon={Layers}
                  title={node.name}
                  body={node.summary}
                  meta={
                    <>
                      <StatusBadge status={coverage?.coverage_status ?? "not_started"} />
                      <Badge>{claims.length} claim(s)</Badge>
                      <Badge>{findings.length} finding(s)</Badge>
                      <Badge>{bundles.length} bundle(s)</Badge>
                    </>
                  }
                />
              );
            })}
          </div>
        ) : (
          <EmptyState>No configured scope units.</EmptyState>
        )}
      </Section>
    </main>
  );
}
