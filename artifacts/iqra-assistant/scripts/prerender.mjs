// Build-time prerender step for anonymous, JS-free-friendly routes ("/",
// "/login", "/register"). Runs after `vite build` (see package.json).
//
// It bundles src/entry-server.tsx with Vite in SSR mode, uses
// react-dom/server to render each route's page component to static markup,
// then writes a standalone static HTML file per route (based on the
// already-built dist/public/index.html shell, so it references the correct
// hashed JS/CSS assets). This lets crawlers that don't execute JavaScript
// see route-specific titles, descriptions, robots directives, canonical
// URLs, and real page content in the very first response — the production
// static host then routes "/login" and "/register" to their dedicated files
// via artifact.toml rewrites, while "/" overwrites the default shell.
import { build } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import viteConfig from "../vite.config.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const publicDir = path.resolve(rootDir, "dist/public");
const ssrOutDir = path.resolve(rootDir, "dist/server");

async function buildSsrBundle() {
  await build({
    ...viteConfig,
    mode: "production",
    build: {
      ...viteConfig.build,
      outDir: ssrOutDir,
      emptyOutDir: true,
      ssr: path.resolve(rootDir, "src/entry-server.tsx"),
      ssrManifest: false,
      rollupOptions: {},
    },
    plugins: (viteConfig.plugins ?? []).filter(
      (p) => !(p && typeof p === "object" && "name" in p && String(p.name).includes("pwa")),
    ),
  });
}

function injectIntoTemplate(template, { html, title, description, robots, canonicalPath }) {
  const canonicalHref = `https://iqra.live${canonicalPath}`;
  let out = template;

  out = out.replace(/<div id="root"><\/div>/, `<div id="root">${html}</div>`);
  out = out.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${description}" />`,
  );
  out = out.replace(
    /<meta name="robots" content=".*?" \/>/,
    `<meta name="robots" content="${robots}" />`,
  );
  out = out.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${title}" />`,
  );
  out = out.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${description}" />`,
  );
  out = out.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${canonicalHref}" />`,
  );
  out = out.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${title}" />`,
  );
  out = out.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${description}" />`,
  );

  if (!out.includes('rel="canonical"')) {
    out = out.replace(
      /<\/head>/,
      `  <link rel="canonical" href="${canonicalHref}" />\n  </head>`,
    );
  } else {
    out = out.replace(
      /<link rel="canonical" href=".*?" \/>/,
      `<link rel="canonical" href="${canonicalHref}" />`,
    );
  }

  return out;
}

async function main() {
  console.log("[prerender] Building SSR bundle...");
  await buildSsrBundle();

  const entryPath = path.join(ssrOutDir, "entry-server.js");
  const { PRERENDER_ROUTES, renderRoute } = await import(`${entryPath}?t=${Date.now()}`);
  const { renderToStaticMarkup } = await import("react-dom/server");

  const template = await fs.readFile(path.join(publicDir, "index.html"), "utf-8");

  for (const route of PRERENDER_ROUTES) {
    const html = renderToStaticMarkup(renderRoute(route));
    const finalHtml = injectIntoTemplate(template, { html, ...route });
    const outPath = path.join(publicDir, route.outFile);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, finalHtml, "utf-8");
    console.log(`[prerender] Wrote ${route.outFile} (robots: ${route.robots})`);
  }

  await fs.rm(ssrOutDir, { recursive: true, force: true });
  console.log("[prerender] Done.");
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
