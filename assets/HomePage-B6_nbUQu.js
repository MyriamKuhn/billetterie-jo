import { j as jsxRuntimeExports } from "./react-C7MzU9h5.js";
import { S as Seo } from "./Seo-sTjcsNVE.js";
import { u as useTranslation } from "./i18n-react-iba5hpPF.js";
import { w as Box, T as Typography, B as Button, Q as Stack } from "./mui-core-DnbKJ2D6.js";
import "./dayjs-BiUQzNTY.js";
import "./helmet-BBUDlL85.js";
import "./vendor-_1F4LxCW.js";
import "./emotion-react-DpnJiwaH.js";
import "./emotion-styled-BZvaByh5.js";
const heroImg = "/assets/jo-hero-D9pjODiB.jpg";
const openingImg = "/assets/opening-34VyOZ_N.jpg";
const athleticsImg = "/assets/athletics-Dfeqo1Ua.webp";
const swimmingImg = "/assets/swimming-C6ZVdkqx.webp";
const judoImg = "/assets/judo-UutAbURm.jpg";
const events = [
  { id: 1, imageUrl: openingImg },
  { id: 2, imageUrl: athleticsImg },
  { id: 3, imageUrl: swimmingImg },
  { id: 4, imageUrl: judoImg }
];
function TicketsPage() {
  const { t } = useTranslation("home");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Seo, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        component: "section",
        sx: {
          position: "relative",
          height: 400,
          mb: 6,
          background: `url(${heroImg}) center/cover no-repeat`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Box,
            {
              sx: {
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.6)"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { position: "relative", textAlign: "center", px: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "h2",
                sx: {
                  position: "relative",
                  color: "common.white",
                  p: 2,
                  borderRadius: 1,
                  textAlign: "center",
                  textTransform: "uppercase"
                },
                children: t("hero.title")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Typography,
              {
                variant: "subtitle1",
                sx: {
                  color: "common.white",
                  mt: 1,
                  fontStyle: "italic",
                  opacity: 0.85
                },
                children: t("hero.subtitle")
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        component: "section",
        sx: { maxWidth: 800, mx: "auto", mb: 8, px: 2 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", gutterBottom: true, children: t("history.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", children: t("history.text") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { textAlign: "center", mb: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", size: "large", href: "/tickets", children: t("cta.title") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { component: "section", sx: { maxWidth: 800, mx: "auto", mb: 4, px: 2 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h3", gutterBottom: true, children: t("events.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", color: "text.secondary", mb: 4, children: t("events.intro") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Box,
        {
          sx: {
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            justifyContent: "center"
          },
          children: events.map((evt) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              sx: {
                flex: "1 1 calc(33.333% - 32px)",
                minWidth: 260,
                maxWidth: 320,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                display: "flex",
                flexDirection: "column"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Box,
                  {
                    component: "img",
                    src: evt.imageUrl,
                    alt: t(`events.item${evt.id}.title`),
                    loading: "lazy",
                    sx: { width: "100%", height: 180, objectFit: "cover" }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 1, sx: { p: 2, flexGrow: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: t(`events.item${evt.id}.title`) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: t(`events.item${evt.id}.description`) })
                ] })
              ]
            },
            evt.id
          ))
        }
      )
    ] })
  ] });
}
export {
  TicketsPage as default
};
//# sourceMappingURL=HomePage-B6_nbUQu.js.map
