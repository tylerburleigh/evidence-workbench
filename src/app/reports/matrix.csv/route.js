import { getSynthesisMatrixCsv, getWorkbenchData } from "../../../lib/public-data.js";

export async function GET() {
  const data = await getWorkbenchData();
  return new Response(`${getSynthesisMatrixCsv(data)}\n`, {
    headers: {
      "content-disposition": `attachment; filename="${data.domainPack.domain.id}-synthesis-matrix.csv"`,
      "content-type": "text/csv; charset=utf-8"
    }
  });
}
