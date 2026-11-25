import type { CallGraph } from '@/types/callGraph';
import type { ParseReply, ParseRequest } from '@/workers/parseHandler';

/**
 * アップロードした .sol を Web Worker で解析し、呼び出し図を返す。
 * 解析に失敗した時は、Worker が返したエラーの文で reject する。
 */
export function parseInWorker(request: ParseRequest): Promise<CallGraph> {
  const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), {
    type: 'module',
  });
  return new Promise<CallGraph>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<ParseReply>) => {
      worker.terminate();
      const reply = event.data;
      if (reply.ok) {
        resolve(reply.callGraph);
      } else {
        reject(new Error(reply.error));
      }
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Failed to parse files'));
    };
    worker.postMessage(request);
  });
}
