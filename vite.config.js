import { join, dirname } from "path";
import { fileURLToPath } from "url";

import viteReact from "@vitejs/plugin-react";
import viteFastifyReact from "@fastify/react/plugin";

const path1 = fileURLToPath(import.meta.url);
import path from "node:path";

export default {
  root: join(dirname(path1), "client"),
  plugins: [viteReact(), viteFastifyReact()],
  server: {
    host: true,
  },
  ssr: {
    external: ["use-sync-external-store"],
    // これで Vite が SSR 用に ESM を処理してくれる（失敗する環境もある）
    noExternal: ["pixi-live2d-display", "pixi.js", "@pixi/*"],
    // もしくは完全に SSR から除外（import しない設計にできるならこちらの方が安定）
    // external: ["pixi-live2d-display", "pixi.js", "@pixi/*"],
  },
  
};
