import type { NextConfig } from "next";

// GitHub Pages (https://sol-flow.cardene.dev) で配るため、静的なfileだけを `out/` に書き出す。
// GitHub Pages は応答ヘッダーを足せないので `headers()` は持たない。
const nextConfig: NextConfig = {
  output: 'export',
  // `/app` を `out/app/index.html` に書き出し、GitHub Pages がそのまま配れる形にする
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
