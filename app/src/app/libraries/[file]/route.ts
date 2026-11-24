import { AVAILABLE_LIBRARIES } from '@/data/libraries';
import { buildLibraryGraph } from '@/lib/libraryGraph';

// `output: 'export'` の build で、ライブラリごとに `out/libraries/<id>.json` を書き出す。
// 拡張子を付けるのは、GitHub Pages が `application/json` として圧縮して配るため。
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return AVAILABLE_LIBRARIES.map((library) => ({ file: `${library.id}.json` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const graph = buildLibraryGraph(file.replace(/\.json$/, ''));
  if (!graph) {
    return Response.json({ error: 'Library not found' }, { status: 404 });
  }
  return Response.json(graph);
}
