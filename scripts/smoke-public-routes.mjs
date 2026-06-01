const baseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3002";

const routes = [
  ["/", ["Evidence Workbench", "Sample Research Domain", "Activity", "Methods"]],
  ["/scope", ["Topics", "Example Topic"]],
  ["/scope/example-topic", ["Example Topic", "Claims", "Bundle State"]],
  ["/claims/sample-claim-example-topic-baseline", ["Example Topic Fixture Baseline", "Support Map", "Sources"]],
  ["/sources/sample-source-example-topic-2026", ["Synthetic Sample Source For Example Topic", "Artifacts", "Findings"]],
  ["/activity", ["Public Change Feed", "Activity Is Not Evidence", "Timeline"]],
  ["/methods", ["Trust Model", "Evidence Ladder", "Review Process"]],
  ["/admin/review", ["Candidate Bundle Queue", "Example Topic Baseline Bootstrap", "Promotion"]],
  ["/admin/review/example-topic-bootstrap-2026-05-31", ["Admin Review", "Actions", "Proposed Changes", "Evidence Reviews"]]
];

async function assertRoute(path, expectedText) {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  if (body.includes("/topics")) {
    throw new Error(`${path} still links to /topics`);
  }

  for (const text of expectedText) {
    if (!body.includes(text)) {
      throw new Error(`${path} is missing expected text: ${text}`);
    }
  }

  console.log(`${path} ${response.status} ok`);
}

for (const [path, expectedText] of routes) {
  await assertRoute(path, expectedText);
}

const oldScopeRoute = await fetch(new URL("/topics/example-topic", baseUrl));
if (oldScopeRoute.status !== 404) {
  throw new Error(`/topics/example-topic returned ${oldScopeRoute.status}; expected 404`);
}

console.log("/topics/example-topic 404 ok");
