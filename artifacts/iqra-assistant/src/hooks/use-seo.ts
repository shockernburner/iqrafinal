import { useEffect } from "react";

export interface SeoOptions {
  title: string;
  description: string;
  robots?: string;
  canonicalPath?: string;
}

const SITE_ORIGIN = "https://iqra.live";

function setMetaByName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Applies route-specific head metadata on the client. This keeps <title>,
 * description, robots directives, and canonical URL correct when navigating
 * between routes without a full page reload. The *initial* HTML response for
 * "/", "/login", and "/register" is additionally prerendered at build time
 * (see scripts/prerender.mjs) so crawlers that don't execute JavaScript still
 * see the correct per-route tags and content.
 */
export function useSeo({ title, description, robots = "index, follow", canonicalPath = "/" }: SeoOptions) {
  useEffect(() => {
    document.title = title;
    setMetaByName("description", description);
    setMetaByName("robots", robots);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    const canonicalHref = `${SITE_ORIGIN}${canonicalPath}`;
    setCanonical(canonicalHref);
  }, [title, description, robots, canonicalPath]);
}
