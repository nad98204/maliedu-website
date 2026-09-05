import React from "react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { AppContent } from "../src/App";

export function renderLanding(pathname) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const tree = <HelmetProvider context={{}}>
      <StaticRouter location={pathname}><AppContent /></StaticRouter>
    </HelmetProvider>;
    // Resolve lazy modules first, then produce complete, script-free boundaries.
    output.resume();
    output.on("end", () => {
      try { resolve(renderToString(tree)); } catch (error) { reject(error); }
    });
    output.on("error", reject);
    const stream = renderToPipeableStream(
      tree,
      {
        onAllReady() { stream.pipe(output); },
        onError(error) { reject(error); },
      },
    );
  });
}
