import { getSynthesisMatrixMarkdown, getWorkbenchData } from "../../../lib/public-data.js";

export async function GET() {
  const data = await getWorkbenchData();
  return new Response(`${getSynthesisMatrixMarkdown(data)}\n`, {
    headers: {
      "content-disposition": `attachment; filename="${data.domainPack.domain.id}-synthesis-matrix.md"`,
      "content-type": "text/markdown; charset=utf-8"
    }
  });
}
