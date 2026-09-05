import { build } from "vite";

await build({
  ssr: { noExternal: ["react-helmet-async"] },
  ssr: { noExternal: ["react-helmet-async"] },
  build: {
    ssr: "scripts/landing-ssr.jsx",
    outDir: ".seo-build/ssr",
    manifest: false,
    rollupOptions: {
      output: { entryFileNames: "landing-ssr.js" },
    },
  },
});
