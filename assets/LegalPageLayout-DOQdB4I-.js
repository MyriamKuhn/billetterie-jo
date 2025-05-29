import { r as reactExports, j as jsxRuntimeExports } from "./react-B5lGuWoF.js";
import { u as useTheme, i as List, L as ListItemButton, b as ListItemText, g as Box, n as Typography, I as IconButton, f as MenuIcon, h as Drawer, a4 as Link, l as Divider, w as Stack } from "./mui-DWveJqef.js";
import { u as useTranslation } from "./i18n-react-BxR3PRIo.js";
import { P as PageWrapper } from "./PageWrapper-B-DuWZ_3.js";
import { S as Seo } from "./Seo-BL7mPHsH.js";
function TableOfContents({
  sections,
  makeId,
  titleKey,
  namespace
}) {
  const theme = useTheme();
  const { t } = useTranslation(namespace);
  const [open, setOpen] = reactExports.useState(false);
  const TocList = /* @__PURE__ */ jsxRuntimeExports.jsx(List, { disablePadding: true, children: sections.map(([subKey]) => {
    const anchor = makeId(subKey);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ListItemButton,
      {
        component: "a",
        href: `#${anchor}`,
        sx: { pl: 2 },
        onClick: () => setOpen(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: t(`${namespace}.${subKey}`) })
      },
      subKey
    );
  }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        component: "nav",
        sx: {
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: theme.mixins.toolbar.minHeight,
          width: 240,
          bgcolor: "background.paper",
          border: (theme2) => `1px solid ${theme2.palette.divider}`,
          borderRadius: 1,
          p: 2,
          flexShrink: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: t(titleKey) }),
          TocList
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: { xs: "block", md: "none" }, mb: 2 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IconButton,
        {
          onClick: () => setOpen(true),
          "aria-label": t(titleKey),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuIcon, {})
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Drawer,
        {
          anchor: "left",
          open,
          onClose: () => setOpen(false),
          ModalProps: { keepMounted: true },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Box,
            {
              role: "presentation",
              sx: {
                width: 250,
                p: 2,
                bgcolor: "background.paper",
                height: "100%",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: t(titleKey) }),
                TocList
              ]
            }
          )
        }
      )
    ] })
  ] });
}
function LegalSection({
  id,
  title,
  content,
  isLast = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { id, sx: { mb: 4, scrollMarginTop: (theme) => theme.mixins.toolbar.minHeight }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Typography,
      {
        component: "div",
        sx: { whiteSpace: "pre-wrap", fontSize: "0.9rem", fontWeight: 200, pl: 2 },
        children: content.split(/(\s+)/).map((seg, i) => {
          if (/https?:\/\/\S+/.test(seg)) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: seg, target: "_blank", rel: "noopener noreferrer", children: seg }, i);
          }
          if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(seg)) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { href: `mailto:${seg}`, children: seg }, i);
          }
          return seg;
        })
      }
    ),
    !isLast && /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { mt: 5, mb: 0 } })
  ] });
}
function LegalPageLayout({
  seoTitle,
  seoDescription,
  pageTitle,
  sections,
  namespace
}) {
  const { t } = useTranslation(namespace);
  const makeId = (key) => key.replace(/([A-Z])/g, "-$1").toLowerCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Seo, { title: t(seoTitle), description: t(seoDescription) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PageWrapper, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", gutterBottom: true, children: t(pageTitle) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: { xs: "column", md: "row" }, spacing: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TableOfContents,
          {
            sections,
            makeId,
            namespace,
            titleKey: `${namespace}.subtitleTableOfContents`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1, overflowWrap: "anywhere", wordBreak: "break-word" }, children: sections.map(([subKey, textKey], idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          LegalSection,
          {
            id: makeId(subKey),
            title: t(`${namespace}.${subKey}`),
            content: t(`${namespace}.${textKey}`),
            isLast: idx === sections.length - 1
          },
          subKey
        )) })
      ] })
    ] })
  ] });
}
export {
  LegalPageLayout as L
};
//# sourceMappingURL=LegalPageLayout-DOQdB4I-.js.map
