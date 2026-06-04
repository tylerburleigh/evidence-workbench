import { getSynthesisMatrixMarkdown, getStudioData } from "../../../lib/public-data.js";

export async function GET() {
  const data = await getStudioData();
  return new Response(`${getSynthesisMatrixMarkdown(data)}\n`, {
    headers: {
      "content-disposition": `attachment; filename="${data.domainPack.domain.id}-synthesis-matrix.md"`,
      "content-type": "text/markdown; charset=utf-8"
    }
  });
}
