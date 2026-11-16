// Only this dependency-free validation helper is shared with browser code.
// All other Cloudflare/Firebase server modules stay outside the client bundle.
export const isServerOnlyModule = id => {
  const normalized = id.replace(/\\/g, '/');
  return normalized.includes('/functions/') &&
    !normalized.endsWith('/functions/_lib/landingHealth.js');
};

export const clientBundleSafety = () => ({
  name: 'client-bundle-safety',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue;
      for (const dependency of [...chunk.imports, ...chunk.dynamicImports]) {
        if (dependency.replace(/\\/g, '/').includes('/functions/')) {
          this.error(`Client chunk ${chunk.fileName} imports an unpublished server module: ${dependency}`);
        }
      }
    }
  },
});
