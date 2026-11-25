import { handleParseRequest, type ParseRequest } from './parseHandler';

// tsconfig の DOM の型は `self` を Window として扱うので、Worker の中の形に直して使う。
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ParseRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

// 画面の処理を止めないよう、.sol の解析をこの Worker の中で実行する。
scope.onmessage = async (event) => {
  scope.postMessage(await handleParseRequest(event.data));
};
