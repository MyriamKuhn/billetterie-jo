const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CartPreview-vYHl-jXR.js","assets/react-C7MzU9h5.js","assets/dayjs-BiUQzNTY.js","assets/mui-icons-VgAuV1_h.js","assets/mui-core-DnbKJ2D6.js","assets/vendor-_1F4LxCW.js","assets/emotion-react-DpnJiwaH.js","assets/emotion-styled-BZvaByh5.js","assets/i18n-react-iba5hpPF.js","assets/i18n-core-CZXZtM2N.js","assets/i18n-detector-CbwplsEi.js","assets/i18n-backend-C6XrdI17.js","assets/zustand-D4l4ryit.js","assets/cookie-consent-D08ijo9N.js","assets/mui-pickers-BIgWd71z.js","assets/HomePage-B6_nbUQu.js","assets/Seo-sTjcsNVE.js","assets/helmet-BBUDlL85.js","assets/TicketsPage-v95tGpFX.js","assets/axios-BSBq6A-N.js","assets/PageWrapper-BWceOkne.js","assets/LegalMentionsPage-CUkhLFgM.js","assets/LegalPageLayout-Be-wXb39.js","assets/TermsPage-CM4g8qKn.js","assets/PolicyPage-DC5UDEUW.js","assets/ContactPage-B7oENzFH.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { j as jsxRuntimeExports, R as React, r as reactExports } from "./react-C7MzU9h5.js";
import { aB as NavLink, aC as useLocation, aD as BrowserRouter, aE as Routes, aF as Route, aG as ReactDOM } from "./vendor-_1F4LxCW.js";
import { s as styled, q as ListItemButton, r as ListItemIcon, t as ListItemText, B as Button, S as Select, M as MenuItem, k as IconButton, l as useTheme, d as useMediaQuery, A as AppBar, v as Toolbar, w as Box, x as CircularProgress, y as Drawer, e as List, z as Badge, E as Divider, T as Typography, H as Fab, J as useScrollTrigger, Z as Zoom, K as createTheme, N as ThemeProvider, O as CssBaseline } from "./mui-core-DnbKJ2D6.js";
import { d as dayjs } from "./dayjs-BiUQzNTY.js";
import { i as instance } from "./i18n-core-CZXZtM2N.js";
import { B as Browser } from "./i18n-detector-CbwplsEi.js";
import { B as Backend, _ as __vitePreload } from "./i18n-backend-C6XrdI17.js";
import { i as initReactI18next, u as useTranslation, w as withTranslation, I as I18nextProvider, T as Trans } from "./i18n-react-iba5hpPF.js";
import { H as HomeIcon, T as TicketIcon, D as DarkModeIcon, L as LightModeIcon, M as MenuIcon, S as ShoppingCartIcon, a as LoginIcon, K as KeyboardArrowUpIcon } from "./mui-icons-VgAuV1_h.js";
import { c as create, p as persist, a as createJSONStorage } from "./zustand-D4l4ryit.js";
import { k as keyframes } from "./emotion-react-DpnJiwaH.js";
import { C as CookieConsent } from "./cookie-consent-D08ijo9N.js";
import { L as LocalizationProvider, A as AdapterDayjs } from "./mui-pickers-BIgWd71z.js";
import "./emotion-styled-BZvaByh5.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
instance.use(Backend).use(Browser).use(initReactI18next).init({
  backend: {
    loadPath: "/locales/{{lng}}/{{ns}}.json"
  },
  fallbackLng: "en",
  supportedLngs: ["fr", "en", "de"],
  detection: {
    order: ["querystring", "cookie", "navigator"],
    caches: ["cookie"]
  },
  ns: ["common", "legal", "privacy", "terms", "contact", "home", "ticket"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});
instance.on("languageChanged", (lng) => {
  dayjs.locale(["fr", "de", "en"].includes(lng) ? lng : "en");
});
const useCartStore = create((set, get) => ({
  items: [],
  addItem: (item) => {
    const items = [...get().items];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
    } else {
      items.push(item);
    }
    set({ items });
  },
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },
  clearCart: () => {
    set({ items: [] });
  }
}));
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: "none",
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  "&.active": {
    backgroundColor: theme.palette.action.selected,
    fontWeight: theme.typography.fontWeightMedium
  }
}));
function ActiveLink(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(StyledNavLink, { ...props });
}
const navItems = [
  { key: "home", href: "/", icon: HomeIcon },
  { key: "tickets", href: "/tickets", icon: TicketIcon }
];
function NavLinkList({ isMobile, onNavigate }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: navItems.map(
    ({ key, href, icon: Icon }) => isMobile ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      ListItemButton,
      {
        component: ActiveLink,
        to: href,
        onClick: () => onNavigate == null ? void 0 : onNavigate(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemIcon, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: t(`navbar.${key}`) })
        ]
      },
      key
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        component: ActiveLink,
        to: href,
        color: "inherit",
        children: t(`navbar.${key}`)
      },
      key
    )
  ) });
}
const logoSrc = "/assets/logo_arcs-DZNcvdlk.png";
const logoParis = "/assets/logo_paris-CUQhftNl.png";
function ActiveButton({ to, children, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      component: ActiveLink,
      to,
      variant: "outlined",
      color: "primary",
      ...props,
      children
    }
  );
}
function getInitialLang() {
  const nav = navigator.language.split("-")[0];
  return ["fr", "en", "de"].includes(nav) ? nav : "en";
}
const useLanguageStore = create()(
  persist(
    (set) => ({
      lang: getInitialLang(),
      setLang: (lang) => {
        set({ lang });
        instance.changeLanguage(lang);
      }
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state == null ? void 0 : state.lang) {
          instance.changeLanguage(state.lang);
        }
      }
    }
  )
);
const fr = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%203%202'%3e%3cpath%20fill='%23CE1126'%20d='M0%200h3v2H0z'/%3e%3cpath%20fill='%23fff'%20d='M0%200h2v2H0z'/%3e%3cpath%20fill='%23002654'%20d='M0%200h1v2H0z'/%3e%3c/svg%3e";
const us = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201235%20650'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20width='1235'%20height='650'%3e%3cdefs%3e%3cpolygon%20id='pt'%20points='-0.1624598481164531,0%200,-0.5%200.1624598481164531,0'%20transform='scale(0.0616)'%20fill='%23FFF'/%3e%3cg%20id='star'%3e%3cuse%20xlink:href='%23pt'%20transform='rotate(-144)'/%3e%3cuse%20xlink:href='%23pt'%20transform='rotate(-72)'/%3e%3cuse%20xlink:href='%23pt'/%3e%3cuse%20xlink:href='%23pt'%20transform='rotate(72)'/%3e%3cuse%20xlink:href='%23pt'%20transform='rotate(144)'/%3e%3c/g%3e%3cg%20id='s5'%3e%3cuse%20xlink:href='%23star'%20x='-0.252'/%3e%3cuse%20xlink:href='%23star'%20x='-0.126'/%3e%3cuse%20xlink:href='%23star'/%3e%3cuse%20xlink:href='%23star'%20x='0.126'/%3e%3cuse%20xlink:href='%23star'%20x='0.252'/%3e%3c/g%3e%3cg%20id='s6'%3e%3cuse%20xlink:href='%23s5'%20x='-0.063'/%3e%3cuse%20xlink:href='%23star'%20x='0.315'/%3e%3c/g%3e%3cg%20id='x4'%3e%3cuse%20xlink:href='%23s6'/%3e%3cuse%20xlink:href='%23s5'%20y='0.054'/%3e%3cuse%20xlink:href='%23s6'%20y='0.108'/%3e%3cuse%20xlink:href='%23s5'%20y='0.162'/%3e%3c/g%3e%3cg%20id='u'%3e%3cuse%20xlink:href='%23x4'%20y='-0.216'/%3e%3cuse%20xlink:href='%23x4'/%3e%3cuse%20xlink:href='%23s6'%20y='0.216'/%3e%3c/g%3e%3crect%20id='stripe'%20width='1235'%20height='50'%20fill='%23B22234'/%3e%3c/defs%3e%3crect%20width='1235'%20height='650'%20fill='%23FFF'/%3e%3cuse%20xlink:href='%23stripe'/%3e%3cuse%20xlink:href='%23stripe'%20y='100'/%3e%3cuse%20xlink:href='%23stripe'%20y='200'/%3e%3cuse%20xlink:href='%23stripe'%20y='300'/%3e%3cuse%20xlink:href='%23stripe'%20y='400'/%3e%3cuse%20xlink:href='%23stripe'%20y='500'/%3e%3cuse%20xlink:href='%23stripe'%20y='600'/%3e%3crect%20width='494'%20height='350'%20fill='%233C3B6E'/%3e%3cuse%20xlink:href='%23u'%20transform='translate(247,175)%20scale(650)'/%3e%3c/svg%3e";
const de = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1000'%20height='600'%20viewBox='0%200%205%203'%3e%3cdesc%3eFlag%20of%20Germany%3c/desc%3e%3crect%20id='black_stripe'%20width='5'%20height='3'%20y='0'%20x='0'%20fill='%23000'/%3e%3crect%20id='red_stripe'%20width='5'%20height='2'%20y='1'%20x='0'%20fill='%23D00'/%3e%3crect%20id='gold_stripe'%20width='5'%20height='1'%20y='2'%20x='0'%20fill='%23FFCE00'/%3e%3c/svg%3e";
const FLAG_MAP = {
  FR: fr,
  US: us,
  DE: de
};
function FlagIcon({ code, width = 24, height = 16, className, style }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: FLAG_MAP[code],
      width,
      height,
      alt: `Flag ${code}`,
      className,
      style
    }
  );
}
const languages = [
  { lang: "fr", country: "FR", label: "Français" },
  { lang: "en", country: "US", label: "English" },
  { lang: "de", country: "DE", label: "Deutsch" }
];
function LanguageSwitcher() {
  const { t } = useTranslation();
  const lang = useLanguageStore((state) => state.lang);
  const setLang = useLanguageStore((state) => state.setLang);
  const handleChange = (e) => {
    setLang(e.target.value);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Select,
    {
      value: lang,
      onChange: handleChange,
      size: "small",
      "aria-label": t("navbar.language"),
      renderValue: (value) => {
        const cfg = languages.find((l) => l.lang === value);
        return cfg ? /* @__PURE__ */ jsxRuntimeExports.jsx(FlagIcon, { code: cfg.country }) : null;
      },
      sx: { minWidth: 60 },
      children: languages.map(({ lang: lang2, country, label }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(MenuItem, { value: lang2, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FlagIcon, { code: country, style: { marginRight: 8 } }),
        label
      ] }, lang2))
    }
  );
}
function ThemeToggle({ mode, toggleMode }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    IconButton,
    {
      color: "inherit",
      onClick: toggleMode,
      "aria-label": mode === "light" ? t("theme.dark") : t("theme.light"),
      children: mode === "light" ? /* @__PURE__ */ jsxRuntimeExports.jsx(DarkModeIcon, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(LightModeIcon, {})
    }
  );
}
const CartPreview = React.lazy(() => __vitePreload(() => import("./CartPreview-vYHl-jXR.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]) : void 0));
function Navbar({ mode, toggleMode }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = () => setOpen((o) => !o);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AppBar,
      {
        position: "fixed",
        color: "inherit",
        elevation: 0,
        sx: { borderBottom: "1px solid", borderColor: "divider" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toolbar, { variant: "dense", sx: { justifyContent: "space-between" }, children: isMobile ? (
          // ────────── BARRE MOBILE ──────────
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { edge: "start", onClick: toggleDrawer, "aria-label": t("navbar.menu"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuIcon, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoSrc, alt: t("navbar.logoJO"), sx: { height: 32 } }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoParis, alt: t("navbar.logoParis"), sx: { height: 32 } })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CartPreview, {}) })
          ] })
        ) : (
          // ────────── BARRE DESKTOP ──────────
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1, mr: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoSrc, alt: t("navbar.logoJO"), sx: { height: 32 } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoParis, alt: t("navbar.logoParis"), sx: { height: 32 } })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(NavLinkList, { isMobile: false })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ThemeToggle,
                {
                  mode,
                  toggleMode,
                  "aria-label": t("navbar.toggleTheme")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageSwitcher, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ActiveButton, { to: "/login", "aria-label": t("navbar.login"), children: t("navbar.login") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 24 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CartPreview, {}) })
            ] })
          ] })
        ) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer, { anchor: "left", open, onClose: toggleDrawer, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { width: 250, height: "100%", display: "flex", flexDirection: "column" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "center", alignItems: "center", gap: 1, p: 2 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoSrc, alt: t("navbar.logoJO"), sx: { height: 32 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: logoParis, alt: t("navbar.logoParis"), sx: { height: 32 } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(List, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(NavLinkList, { isMobile: true, onNavigate: toggleDrawer }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItemButton, { component: ActiveLink, to: "/cart", onClick: toggleDrawer, "aria-label": t("navbar.cart"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemIcon, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              badgeContent: cartCount,
              color: "info",
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCartIcon, {})
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: t("navbar.cart") })
        ] }, "cart"),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, { sx: { my: 1 } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItemButton, { component: ActiveLink, to: "/login", onClick: toggleDrawer, "aria-label": t("navbar.login"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemIcon, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoginIcon, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemText, { primary: t("navbar.login") })
        ] }, "login")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: "auto", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageSwitcher, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ThemeToggle,
          {
            mode,
            toggleMode,
            "aria-label": t("navbar.toggleTheme")
          }
        )
      ] })
    ] }) })
  ] });
}
function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();
  const links = [
    { to: "/contact", labelKey: "footer.contact" },
    { to: "/legal-mentions", labelKey: "footer.legalMentions" },
    { to: "/terms", labelKey: "footer.terms" },
    { to: "/privacy-policy", labelKey: "footer.privacy" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { component: "footer", sx: {
    bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderTop: `1px solid ${theme.palette.divider}`
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        sx: {
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 1 : 2,
          py: isMobile ? 1 : 1.5
        },
        children: links.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ActiveButton,
          {
            to: link.to,
            variant: "text",
            size: "small",
            sx: {
              fontSize: isMobile ? "0.7rem" : "0.8rem",
              color: theme.palette.text.primary
            },
            children: t(link.labelKey)
          },
          link.to
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: {
      py: isMobile ? 0.5 : 1
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Typography,
      {
        variant: "caption",
        component: "div",
        align: "center",
        sx: {
          color: theme.palette.text.secondary,
          fontSize: isMobile ? "0.5rem" : "0.6rem",
          lineHeight: 1
        },
        children: t("footer.copy", { year: (/* @__PURE__ */ new Date()).getFullYear() })
      }
    ) })
  ] });
}
function ScrollTop(props) {
  const { children, window: window2 } = props;
  const trigger = useScrollTrigger({
    target: window2 ? window2() : void 0,
    disableHysteresis: true,
    threshold: 100
  });
  const handleClick = (event) => {
    const anchor = (event.currentTarget.ownerDocument || document).querySelector("#back-to-top-anchor");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Zoom, { in: trigger, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      onClick: handleClick,
      role: "presentation",
      sx: {
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 1300
      },
      children
    }
  ) });
}
function BackToTop(props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { id: "back-to-top-anchor" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollTop, { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Fab,
      {
        size: "small",
        "aria-label": t("scroll.back_to_top"),
        sx: {
          bgcolor: isDark ? "primary.dark" : "info.main",
          color: isDark ? "primary.contrastText" : "info.contrastText",
          "&:hover": {
            bgcolor: isDark ? "primary.main" : "info.light"
          }
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyboardArrowUpIcon, {})
      }
    ) })
  ] });
}
const slide = keyframes`
  0%   { transform: translateX(0);   opacity: 0.6; }
  25%  { opacity: 1; }
  50%  { transform: translateX(20px); opacity: 0.6; }
  75%  { opacity: 1; }
  100% { transform: translateX(0);   opacity: 0.6; }
`;
function OlympicLoader() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Box,
    {
      sx: {
        display: "inline-block",
        animation: `${slide} 1.5s ease-in-out infinite`,
        // Centrage si besoin dans un container
        width: 160,
        height: 84
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "svg",
        {
          viewBox: "0 0 230 120",
          width: "100%",
          height: "100%",
          xmlns: "http://www.w3.org/2000/svg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "50", cy: "50", r: "30", stroke: "#0072CE", strokeWidth: "8", fill: "none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "110", cy: "50", r: "30", stroke: "#000000", strokeWidth: "8", fill: "none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "170", cy: "50", r: "30", stroke: "#DF0024", strokeWidth: "8", fill: "none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "80", cy: "85", r: "30", stroke: "#F4C300", strokeWidth: "8", fill: "none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "140", cy: "85", r: "30", stroke: "#00A651", strokeWidth: "8", fill: "none" })
          ]
        }
      )
    }
  );
}
function ScrollToTop() {
  const { pathname } = useLocation();
  reactExports.useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    __publicField(this, "handleReload", () => {
      this.setState(({ reloadKey }) => ({
        hasError: false,
        reloadKey: reloadKey + 1
      }));
    });
    this.state = { hasError: false, reloadKey: 0 };
  }
  static getDerivedStateFromError(_) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }
  render() {
    const { t, children } = this.props;
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 4, textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", gutterBottom: true, children: t("errors.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { mb: 2 }, children: t("errors.unexpected") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "contained", onClick: this.handleReload, children: t("errors.retry") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "text",
            onClick: () => window.location.href = "/",
            sx: { ml: 2 },
            children: t("errors.home")
          }
        )
      ] });
    }
    return React.Children.map(
      children,
      (child) => React.isValidElement(child) ? React.cloneElement(child, { key: `reload-${this.state.reloadKey}` }) : child
    );
  }
}
const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
const HomePage = reactExports.lazy(() => __vitePreload(() => import("./HomePage-B6_nbUQu.js"), true ? __vite__mapDeps([15,1,2,16,17,5,6,7,8,4]) : void 0));
const TicketsPage = reactExports.lazy(() => __vitePreload(() => import("./TicketsPage-v95tGpFX.js"), true ? __vite__mapDeps([18,1,2,16,17,5,6,7,8,3,4,14,19,20,9,10,11,12,13]) : void 0));
const LegalMentionsPage = reactExports.lazy(() => __vitePreload(() => import("./LegalMentionsPage-CUkhLFgM.js"), true ? __vite__mapDeps([21,1,2,22,3,4,5,6,7,8,20,16,17]) : void 0));
const TermsPage = reactExports.lazy(() => __vitePreload(() => import("./TermsPage-CM4g8qKn.js"), true ? __vite__mapDeps([23,1,2,22,3,4,5,6,7,8,20,16,17]) : void 0));
const PolicyPage = reactExports.lazy(() => __vitePreload(() => import("./PolicyPage-DC5UDEUW.js"), true ? __vite__mapDeps([24,1,2,22,3,4,5,6,7,8,20,16,17]) : void 0));
const ContactPage = reactExports.lazy(() => __vitePreload(() => import("./ContactPage-B7oENzFH.js"), true ? __vite__mapDeps([25,1,2,20,4,5,6,7,16,17,8]) : void 0));
function App({ mode, toggleMode }) {
  const lang = useLanguageStore((state) => state.lang);
  reactExports.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  reactExports.useEffect(() => {
    const base = instance.language.split("-")[0];
    if (base !== lang) instance.changeLanguage(lang);
  }, [lang]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(BrowserRouter, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollToTop, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", flexDirection: "column", minHeight: "100vh" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Navbar, { mode, toggleMode }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Toolbar, { id: "back-to-top-anchor", variant: "dense" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: 1 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(OlympicLoader, {}) }), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomePage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/tickets", element: /* @__PURE__ */ jsxRuntimeExports.jsx(TicketsPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/cart", element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomePage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/contact", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ContactPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/legal-mentions", element: /* @__PURE__ */ jsxRuntimeExports.jsx(LegalMentionsPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/terms", element: /* @__PURE__ */ jsxRuntimeExports.jsx(TermsPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/privacy-policy", element: /* @__PURE__ */ jsxRuntimeExports.jsx(PolicyPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomePage, {}) })
      ] }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackToTop, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
    ] })
  ] });
}
const brandColors = {
  primary: "#68B9B5",
  secondary: "#0B1B2B",
  info: "#0085C7",
  warning: "#FFCD00",
  error: "#E31937",
  success: "#009739"
};
const backgroundDefaults = {
  light: { default: "#F4F4F4", paper: "#FFFFFF" },
  dark: { default: "#121212", paper: "#0C1F2B" }
};
const textDefaults = {
  light: { primary: "#0C1B2B", secondary: "#576271" },
  dark: { primary: "#F9E8C4", secondary: "#C0C0C0" }
};
const customShadows = {
  1: "0px 1px 3px rgba(0,0,0,0.2)",
  2: "0px 1px 5px rgba(0,0,0,0.14)",
  3: "0px 1px 8px rgba(0,0,0,0.12)",
  4: "0px 2px 4px rgba(0,0,0,0.12)"
};
const getAppTheme = (mode) => {
  const isLight = mode === "light";
  const defaultTheme = createTheme();
  const defaultShadows = defaultTheme.shadows;
  const shadows = defaultShadows.map(
    (sh, idx) => customShadows[idx] ?? sh
  );
  return createTheme({
    palette: {
      mode,
      primary: { main: brandColors.primary },
      secondary: { main: brandColors.secondary },
      error: { main: brandColors.error },
      warning: { main: brandColors.warning },
      info: { main: brandColors.info },
      success: { main: brandColors.success },
      background: backgroundDefaults[mode],
      text: textDefaults[mode],
      divider: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"
    },
    shape: { borderRadius: 10 },
    shadows,
    typography: {
      fontFamily: "Poppins, Arial, sans-serif",
      h1: { fontSize: "2.5rem", fontWeight: 700 },
      h2: { fontSize: "2rem", fontWeight: 700 },
      h3: { fontSize: "1.75rem", fontWeight: 700 },
      h4: { fontSize: "1.5rem", fontWeight: 400, textTransform: "uppercase" },
      h5: { fontSize: "1.25rem", fontWeight: 400 },
      h6: { fontSize: "1.125rem", fontWeight: 500, textTransform: "uppercase" },
      body1: { fontSize: "1rem", fontWeight: 400 },
      body2: { fontSize: "0.875rem", fontWeight: 400 },
      subtitle1: { fontSize: "1rem", fontWeight: 400 },
      subtitle2: { fontSize: "0.875rem", fontWeight: 500 }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            padding: "40px 20px"
          })
        }
      },
      MuiButton: {
        styleOverrides: {
          text: ({ theme, ownerState }) => {
            if (theme.palette.mode === "light" && ownerState.color !== "inherit") {
              return {
                color: theme.palette.info.main,
                "&:hover": {
                  backgroundColor: `${theme.palette.info.main}10`
                }
              };
            }
            return {};
          },
          containedPrimary: ({ theme }) => ({
            backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.info.main,
            color: theme.palette.mode === "dark" ? theme.palette.primary.contrastText : theme.palette.info.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.info.light
            }
          }),
          ...isLight && {
            outlinedPrimary: {
              borderColor: brandColors.secondary,
              color: brandColors.secondary,
              "&:hover": {
                borderColor: brandColors.secondary,
                backgroundColor: `${brandColors.secondary}10`
              }
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: isLight ? theme.palette.info.main : theme.palette.text.primary
          })
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: isLight ? theme.palette.info.main : theme.palette.text.primary
          })
        }
      },
      MuiBadge: {
        styleOverrides: {
          badge: ({ theme }) => ({
            backgroundColor: isLight ? theme.palette.text.primary : theme.palette.info.main,
            color: "#fff",
            minWidth: 16,
            height: 16,
            fontSize: "0.625rem",
            borderRadius: "50%",
            transform: "translate(35%, 35%)"
          })
        }
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.mode === "light" ? theme.palette.primary.dark : theme.palette.primary.light,
            textDecoration: "underline",
            "&:hover": {
              color: theme.palette.primary.main
            }
          })
        }
      },
      MuiRadio: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            "&.Mui-checked": {
              color: theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.info.main
            }
          })
        }
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            // Centrage et marge
            display: "flex",
            justifyContent: "center",
            padding: "1rem 0"
          }
        }
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            minWidth: 32,
            height: 32,
            margin: "0 4px",
            "&.Mui-selected": {
              backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.info.main,
              color: theme.palette.mode === "dark" ? theme.palette.primary.contrastText : theme.palette.info.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.info.light
              }
            }
          })
        }
      }
    }
  });
};
const useThemeStore = create()(
  persist(
    (set) => ({
      mode: "light",
      toggle: () => set((state) => ({
        mode: state.mode === "light" ? "dark" : "light"
      })),
      setLight: () => set({ mode: "light" }),
      setDark: () => set({ mode: "dark" })
    }),
    {
      name: "theme-mode",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
function Root() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = useThemeStore((s) => s.mode);
  const setLight = useThemeStore((s) => s.setLight);
  const setDark = useThemeStore((s) => s.setDark);
  const toggleMode = useThemeStore((s) => s.toggle);
  reactExports.useEffect(() => {
    if (localStorage.getItem("theme-mode") != null) return;
    if (prefersDarkMode) {
      setDark();
    } else {
      setLight();
    }
  }, []);
  const lang = useLanguageStore((state) => state.lang);
  reactExports.useEffect(() => {
    instance.changeLanguage(lang);
  }, [lang]);
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(I18nextProvider, { i18n: instance, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ThemeProvider, { theme: getAppTheme(mode), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CssBaseline, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CookieConsent,
      {
        location: "bottom",
        buttonText: t("cookieBanner.accept"),
        declineButtonText: t("cookieBanner.decline"),
        enableDeclineButton: true,
        cookieName: "jo2024_cookie_consent",
        style: {
          position: "fixed",
          bottom: 0,
          width: "100%",
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          zIndex: 2e3
        },
        buttonStyle: {
          background: "#009739",
          borderRadius: "10px",
          color: "#fff",
          fontWeight: "bold",
          textTransform: "uppercase"
        },
        declineButtonStyle: {
          background: "#E31937",
          color: "#fff",
          borderRadius: "10px",
          fontWeight: "bold",
          textTransform: "uppercase"
        },
        onAccept: () => {
          console.log("Cookies acceptés");
        },
        onDecline: () => {
          console.log("Cookies refusés");
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Trans,
          {
            i18nKey: "cookieBanner.message",
            components: {
              privacyLink: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: "/privacy-policy",
                  style: { color: "#68B9B5", textDecoration: "underline" }
                }
              )
            }
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LocalizationProvider,
      {
        dateAdapter: AdapterDayjs,
        adapterLocale: instance.language,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, { mode, toggleMode })
      }
    )
  ] }) });
}
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(/* @__PURE__ */ jsxRuntimeExports.jsx(Root, {}));
export {
  OlympicLoader as O,
  useCartStore as a,
  useLanguageStore as u
};
//# sourceMappingURL=index-BBST7aK2.js.map
