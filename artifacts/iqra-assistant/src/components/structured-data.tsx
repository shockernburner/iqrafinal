// Schema.org JSON-LD structured data for the public, prerendered marketing
// pages. These components render a <script type="application/ld+json"> node
// directly in the page markup so the schema is present in the very first HTML
// response (the "/" route is prerendered at build time via
// scripts/prerender.mjs), letting search engines and AI crawlers understand the
// brand, mission, and page role without executing JavaScript.

const SITE_ORIGIN = "https://iqra.live";

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

const ORG_DESCRIPTION =
  "IQRA Assistant is an Islamic ethics and leadership chat assistant that provides guidance rooted in traditional texts. It is not a general-purpose chatbot and does not issue religious rulings (fatawa).";

const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "IQRA Assistant",
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
  image: `${SITE_ORIGIN}/opengraph.jpg`,
  description: ORG_DESCRIPTION,
  email: "contact@iqra.live",
};

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_ORIGIN}/`,
  name: "IQRA Assistant",
  description:
    "Wisdom and guidance rooted in tradition — an Islamic ethics and leadership companion for reflection, grounded in classical texts.",
  publisher: { "@id": ORG_ID },
  inLanguage: "en",
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Site-level Organization + WebSite schema for the home/landing page. */
export function HomeStructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [organizationNode, websiteNode],
      }}
    />
  );
}
