import { j as jsxRuntimeExports } from "./react-B5lGuWoF.js";
import { P as PageWrapper } from "./PageWrapper-B-DuWZ_3.js";
import { S as Seo } from "./Seo-BL7mPHsH.js";
import { u as useTranslation } from "./i18n-react-BxR3PRIo.js";
import { n as Typography, g as Box, w as Stack, a4 as Link } from "./mui-DWveJqef.js";
import "./dayjs-BiUQzNTY.js";
import "./helmet-D1aaObwr.js";
import "./vendor-RytlYodM.js";
import "./emotion-z7-Z7b9V.js";
function ContactPage() {
  const { t } = useTranslation("contact");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Seo, { title: t("contact.seoTitle"), description: t("contact.seoDescription") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PageWrapper, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", gutterBottom: true, children: t("contact.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 2 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", children: t("contact.intro") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 4, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: t("contact.emailLabel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "mailto:contact@jo2024-ticketing.com", children: "contact@jo2024-ticketing.com" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: t("contact.phoneLabel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: "tel:+33123456789", children: "+33 1 23 45 67 89" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: t("contact.addressLabel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { children: [
              "10 rue des Jeux",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              "75015 Paris",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              "France"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: t("contact.hoursLabel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { children: t("contact.hours") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 4, fontStyle: "italic" }, children: t("contact.note") })
      ] })
    ] })
  ] });
}
export {
  ContactPage as default
};
//# sourceMappingURL=ContactPage-CqaarKKA.js.map
