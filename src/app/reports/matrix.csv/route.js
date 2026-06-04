import { getSynthesisMatrixCsv, getStudioData } from "../../../lib/public-data.js";

export async function GET() {
  const data = await getStudioData();
  return new Response(`${getSynthesisMatrixCsv(data)}\n`, {
    headers: {
      "content-disposition": `attachment; filename="${data.domainPack.domain.id}-synthesis-matrix.csv"`,
      "content-type": "text/csv; charset=utf-8"
    }
  });
}
