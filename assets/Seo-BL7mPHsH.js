import { j as jsxRuntimeExports } from "./react-B5lGuWoF.js";
import { H as HelmetExport } from "./helmet-D1aaObwr.js";
import { u as useTranslation } from "./i18n-react-BxR3PRIo.js";
const BASE_URL$1 = "https://jo2024.mkcodecreations.dev";
function makeJsonLd(t) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": t("seo.title"),
    "url": BASE_URL$1,
    "logo": `${BASE_URL$1}/assets/logos/jo_logo.png`,
    "description": t("seo.description"),
    "contactPoint": [{
      "@type": "ContactPoint",
      "contactType": "Developer",
      "areaServed": "FR, DE, EN",
      "availableLanguage": ["French", "English", "German"]
    }]
  };
}
const BASE_URL = "https://jo2024.mkcodecreations.dev";
function Seo({ title, description, noIndex }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const url = `${BASE_URL}/`;
  const defaultTitle = t("seo.title");
  const defaultDescription = t("seo.description");
  const jsonLd = makeJsonLd(t);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(HelmetExport, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("html", { lang: locale }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: title ?? defaultTitle }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "description", content: description ?? defaultDescription }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "keywords", content: t("seo.keywords") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { "http-equiv": "Content-Language", content: "fr" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("link", { rel: "canonical", href: url }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "og:type", content: "website" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "og:url", content: url }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "og:title", content: title ?? defaultTitle }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "og:description", content: description ?? defaultDescription }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { property: "og:image", content: `${BASE_URL}/assets/og-image.png` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "twitter:title", content: title ?? defaultTitle }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "twitter:description", content: description ?? defaultDescription }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meta", { name: "twitter:image", content: `${BASE_URL}/assets/twitter-card.png` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) }
      }
    )
  ] });
}
export {
  Seo as S
};
//# sourceMappingURL=Seo-BL7mPHsH.js.map
