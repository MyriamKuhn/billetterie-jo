import { j as jsxRuntimeExports, r as reactExports } from "./react-C7MzU9h5.js";
import { O as OlympicLoader, u as useLanguageStore } from "./index-BBST7aK2.js";
import { S as Seo } from "./Seo-sTjcsNVE.js";
import { A as ArrowUpwardIcon, b as ArrowDownwardIcon, M as MenuIcon, C as CloseIcon } from "./mui-icons-VgAuV1_h.js";
import { d as dayjs } from "./dayjs-BiUQzNTY.js";
import { i as TextField, h as FormControl, I as InputLabel, S as Select, M as MenuItem, R as FormLabel, U as RadioGroup, V as FormControlLabel, W as Radio, w as Box, X as ToggleButtonGroup, Y as ToggleButton, l as useTheme, T as Typography, Q as Stack, B as Button, k as IconButton, y as Drawer, _ as Card, $ as CardMedia, a0 as CardContent, C as Chip, n as Dialog, a1 as DialogTitle, p as DialogContent, D as DialogActions, a2 as Pagination } from "./mui-core-DnbKJ2D6.js";
import { u as useTranslation } from "./i18n-react-iba5hpPF.js";
import { D as DatePicker } from "./mui-pickers-BIgWd71z.js";
import { a as axios } from "./axios-BSBq6A-N.js";
import { P as PageWrapper } from "./PageWrapper-BWceOkne.js";
import "./vendor-_1F4LxCW.js";
import "./emotion-react-DpnJiwaH.js";
import "./emotion-styled-BZvaByh5.js";
import "./i18n-core-CZXZtM2N.js";
import "./i18n-detector-CbwplsEi.js";
import "./i18n-backend-C6XrdI17.js";
import "./zustand-D4l4ryit.js";
import "./cookie-consent-D08ijo9N.js";
import "./helmet-BBUDlL85.js";
function FilterField({ label, value, onChange, type }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    TextField,
    {
      label,
      type,
      size: "small",
      fullWidth: true,
      value,
      onChange: (e) => onChange(e.target.value),
      slotProps: { inputLabel: { shrink: true } }
    }
  );
}
function FilterSelect({
  label,
  value,
  options,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { size: "small", fullWidth: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        label,
        value,
        onChange: (e) => onChange(e.target.value),
        children: options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: o, children: o }, o))
      }
    )
  ] });
}
function FilterRadios({
  legend,
  value,
  options,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { component: "fieldset", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FormLabel, { component: "legend", children: legend }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RadioGroup,
      {
        row: true,
        value,
        onChange: (_, v) => onChange(v),
        children: options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          FormControlLabel,
          {
            value: o.value,
            control: /* @__PURE__ */ jsxRuntimeExports.jsx(Radio, { size: "small" }),
            label: o.label
          },
          o.value
        ))
      }
    )
  ] });
}
function SortControl({
  fields,
  sortBy,
  order,
  onSortChange,
  label
}) {
  const { t } = useTranslation();
  const handleField = (_, newField) => {
    if (newField) onSortChange(newField, order);
  };
  const handleOrder = (_, newOrder) => {
    if (newOrder) onSortChange(sortBy, newOrder);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { component: "fieldset", fullWidth: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FormLabel, { component: "legend", sx: { mb: 1 }, children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ToggleButtonGroup,
        {
          value: sortBy,
          exclusive: true,
          size: "small",
          onChange: handleField,
          "aria-label": t("sorting.title"),
          sx: { flex: 1 },
          children: fields.map(({ value, label: label2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleButton, { value, "aria-label": String(value), children: label2 }, value))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        ToggleButtonGroup,
        {
          value: order,
          exclusive: true,
          size: "small",
          onChange: handleOrder,
          "aria-label": t("sorting.order"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleButton, { value: "asc", "aria-label": t("sorting.ascendant"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpwardIcon, { fontSize: "small" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleButton, { value: "desc", "aria-label": t("sorting.descendant"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownwardIcon, { fontSize: "small" }) })
          ]
        }
      )
    ] })
  ] });
}
function ProductsFilters({
  filters,
  onChange
}) {
  const { t } = useTranslation("ticket");
  const theme = useTheme();
  const [open, setOpen] = reactExports.useState(false);
  const sortFields = [
    { value: "name", label: t("filters.name") },
    { value: "price", label: t("filters.price") },
    { value: "date", label: t("filters.date") }
  ];
  const content = /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { width: 260, py: 2, px: 1 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", gutterBottom: true, children: t("filters.title") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { mx: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterField,
        {
          label: t("filters.name"),
          value: filters.name,
          onChange: (v) => onChange({ name: v, page: 1 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterField,
        {
          label: t("filters.category"),
          value: filters.category,
          onChange: (v) => onChange({ category: v, page: 1 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterField,
        {
          label: t("filters.location"),
          value: filters.location,
          onChange: (v) => onChange({ location: v, page: 1 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DatePicker,
        {
          label: t("filters.date"),
          value: filters.date ? dayjs(filters.date) : null,
          onChange: (newVal) => onChange({ date: (newVal == null ? void 0 : newVal.format("YYYY-MM-DD")) || "", page: 1 }),
          slotProps: {
            textField: {
              size: "small",
              fullWidth: true,
              InputLabelProps: { shrink: true }
            }
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterRadios,
        {
          legend: t("filters.places"),
          value: filters.places.toString(),
          options: [
            { value: "0", label: t("filters.all_places") },
            { value: "1", label: t("filters.one_place") },
            { value: "2", label: t("filters.two_places") },
            { value: "4", label: t("filters.four_places") }
          ],
          onChange: (v) => onChange({ places: Number(v), page: 1 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortControl,
        {
          fields: sortFields,
          sortBy: filters.sortBy,
          order: filters.order,
          onSortChange: (newField, newOrder) => onChange({ sortBy: newField, order: newOrder, page: 1 }),
          label: t("filters.sort_by")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterSelect,
        {
          label: t("filters.offers_per_page"),
          value: filters.perPage,
          options: [1, 5, 10, 15, 25, 50, 100],
          onChange: (v) => onChange({ perPage: v, page: 1 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outlined",
          fullWidth: true,
          onClick: () => onChange({
            name: "",
            category: "",
            location: "",
            date: "",
            places: 0,
            sortBy: "name",
            order: "asc",
            perPage: 15,
            page: 1
          }),
          children: t("filters.reset")
        }
      )
    ] })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        component: "aside",
        sx: {
          display: { xs: "none", md: "block" },
          position: "sticky",
          top: theme.mixins.toolbar.minHeight,
          bgcolor: "background.paper",
          border: (t2) => `1px solid ${t2.palette.divider}`,
          borderRadius: 1,
          width: 260
        },
        children: content
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: { xs: "block", md: "none" }, mb: 2 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: () => setOpen(true), "aria-label": t("filters.title"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MenuIcon, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Drawer, { open, onClose: () => setOpen(false), keepMounted: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { position: "relative" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          IconButton,
          {
            onClick: () => setOpen(false),
            size: "small",
            sx: {
              position: "absolute",
              top: 8,
              right: 8
            },
            "aria-label": t("filters.close"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {})
          }
        ),
        content
      ] }) })
    ] })
  ] });
}
function ProductCard({ product: p, fmtCur, fmtDate, onViewDetails }) {
  const { t } = useTranslation(["common", "ticket"]);
  const soldOut = p.stock_quantity === 0;
  const finalPrice = p.price * (1 - p.sale);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { flex: { xs: "1 1 calc(33% - 32px)", md: "1 1 100%" }, minWidth: { xs: 280, md: "auto" }, maxWidth: { xs: 320, md: "100%" } }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { sx: { display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, p: 2, gap: 1 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardMedia, { component: "img", image: p.product_details.image, alt: p.name, loading: "lazy", sx: { width: { xs: "100%", md: 320 }, height: 180, objectFit: "cover", alignSelf: { xs: "auto", md: "center" } } }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { sx: { flexGrow: 1 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", children: p.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
        fmtDate(p.product_details.date),
        p.product_details.time && ` – ${p.product_details.time}`
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 }, children: p.product_details.location }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", children: t("ticket:tickets.places", { count: p.product_details.places }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "baseline", gap: 1, mt: 1 }, children: [
        p.sale > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { textDecoration: "line-through" }, children: fmtCur(p.price) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: fmtCur(finalPrice) }),
        p.sale > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `–${Math.round(p.sale * 100)}%`, size: "small" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: soldOut ? "error.main" : "text.secondary", sx: { mt: 1 }, children: soldOut ? t("ticket:tickets.out_of_stock") : t("ticket:tickets.available", { count: p.stock_quantity }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Box,
      {
        sx: {
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          "& .MuiButton-root": {
            whiteSpace: "nowrap"
          }
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "outlined", onClick: () => onViewDetails(p.id), children: t("ticket:tickets.more_info") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", variant: "contained", disabled: soldOut, href: `/tickets/${p.id}`, children: soldOut ? t("ticket:tickets.out_of_stock") : t("ticket:tickets.buy") })
        ]
      }
    )
  ] }) });
}
function ProductGrid({ products, fmtCur, fmtDate, onViewDetails }) {
  const { t } = useTranslation("ticket");
  if (products.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { textAlign: "center" }, children: t("tickets.not_found") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", gap: 4, justifyContent: { xs: "center", md: "flex-start" }, flexWrap: { xs: "wrap", md: "nowrap" }, flexDirection: { xs: "row", md: "column" } }, children: products.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProductCard, { product: p, fmtCur, fmtDate, onViewDetails }, p.id)) });
}
const API_BASE_URL = "https://api-jo2024.mkcodecreations.dev";
function useProducts(filters, lang) {
  const [products, setProducts] = reactExports.useState([]);
  const [total, setTotal] = reactExports.useState(0);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [validationErrors, setValidationErrors] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setLoading(true);
    setError(null);
    setValidationErrors(null);
    const sortMap = {
      name: "name",
      price: "price",
      date: "product_details->date"
    };
    const apiSort = sortMap[filters.sortBy];
    const params = {
      per_page: Math.max(1, filters.perPage),
      page: filters.page,
      sort_by: apiSort,
      order: filters.order,
      ...filters.name && { name: filters.name },
      ...filters.category && { category: filters.category },
      ...filters.location && { location: filters.location },
      ...filters.date && { date: filters.date },
      ...filters.places > 0 && { places: filters.places }
    };
    axios.get(`${API_BASE_URL}/api/products`, { params, headers: { "Accept-Language": lang } }).then((res) => {
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    }).catch((err) => {
      var _a;
      if (axios.isAxiosError(err)) {
        const status = (_a = err.response) == null ? void 0 : _a.status;
        if (status === 422) {
          setValidationErrors(err.response.data.errors);
          return;
        }
        if (status === 404) {
          setProducts([]);
          setTotal(0);
          return;
        }
      }
      setError(err.code);
    }).finally(() => setLoading(false));
  }, [filters, lang]);
  return { products, total, loading, error, validationErrors };
}
function useProductDetails(productId, lang) {
  const [product, setProduct] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (productId == null) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setProduct(null);
    axios.get(
      `${API_BASE_URL}/api/products/${productId}`,
      {
        headers: { "Accept-Language": lang }
      }
    ).then((res) => {
      setProduct(res.data.data);
    }).catch((err) => {
      var _a, _b;
      const msg = axios.isAxiosError(err) && ((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.message) ? err.response.data.message : err.message;
      setError(msg);
    }).finally(() => {
      setLoading(false);
    });
  }, [productId, lang]);
  return { product, loading, error };
}
function ErrorDisplay({
  title,
  message,
  showRetry = true,
  retryButtonText,
  onRetry,
  showHome = true,
  homeButtonText
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { p: 4, textAlign: "center" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", gutterBottom: true, children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { mb: 2 }, children: message }),
    showRetry && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "text", onClick: onRetry, children: retryButtonText }),
    showHome && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "contained",
        onClick: () => window.location.href = "/",
        sx: { ml: 2 },
        children: homeButtonText
      }
    )
  ] });
}
function formatCurrency(value, locale = "en", currency = "EUR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}
function formatDate(isoDate, locale = "en", options = { day: "numeric", month: "long", year: "numeric" }) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, options).format(d);
}
function ProductDetailsModal({ open, productId, lang, onClose }) {
  const { t } = useTranslation("ticket");
  const { product, loading, error } = useProductDetails(open ? productId : null, lang);
  const fmtCur = (v) => formatCurrency(v, lang, "EUR");
  const dateStr = product ? formatDate(product.product_details.date, lang) : "";
  const soldOut = (product == null ? void 0 : product.stock_quantity) === 0;
  const finalPrice = ((product == null ? void 0 : product.price) ?? 0) * (1 - ((product == null ? void 0 : product.sale) ?? 0));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onClose, maxWidth: "sm", fullWidth: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: loading ? t("tickets.loading") : error ? t("tickets.error") : product == null ? void 0 : product.name }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { dividers: true, children: [
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { textAlign: "center", py: 4 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(OlympicLoader, {}) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorDisplay, { title: t("errors.title"), message: t("errors.not_found"), showRetry: false, showHome: false }),
      product && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { component: "div", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            component: "img",
            src: product.product_details.image,
            alt: product.name,
            loading: "lazy",
            sx: { width: "100%", height: 200, objectFit: "cover", mb: 2 }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body1", children: [
          dateStr,
          product.product_details.time && ` – ${product.product_details.time}`
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 1 }, children: product.product_details.location }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 }, children: t("tickets.category", { category: product.product_details.category }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { mb: 1 }, children: product.product_details.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", color: "text.secondary", children: t("tickets.places", { count: product.product_details.places }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", alignItems: "baseline", gap: 1, mt: 1 }, children: [
          product.sale > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { textDecoration: "line-through" }, children: fmtCur(product.price) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle1", fontWeight: "bold", children: fmtCur(finalPrice) }),
          product.sale > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `–${Math.round(product.sale * 100)}%`, size: "small" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", color: soldOut ? "error.main" : "text.secondary", sx: { mt: 1 }, children: soldOut ? t("tickets.out_of_stock") : t("tickets.available", { count: product.stock_quantity }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogActions, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, children: t("tickets.close") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "contained",
          disabled: (product == null ? void 0 : product.stock_quantity) === 0 || loading || !!error,
          href: `/tickets/${productId}`,
          children: soldOut ? t("tickets.out_of_stock") : t("tickets.buy")
        }
      )
    ] })
  ] });
}
function ProductsPage() {
  const { t } = useTranslation("ticket");
  const lang = useLanguageStore((s) => s.lang);
  const [filters, setFilters] = reactExports.useState({
    name: "",
    category: "",
    location: "",
    date: "",
    places: 0,
    sortBy: "name",
    order: "asc",
    perPage: 15,
    page: 1
  });
  const { products, total, loading, error, validationErrors } = useProducts(filters, lang);
  const [detailsId, setDetailsId] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (validationErrors) {
      const cleanup = {};
      if (validationErrors.sort_by) {
        cleanup.sortBy = "name";
        cleanup.order = "asc";
      }
      if (validationErrors.date) {
        cleanup.date = "";
      }
      if (validationErrors.name) {
        cleanup.name = "";
      }
      if (validationErrors.category) {
        cleanup.category = "";
      }
      if (validationErrors.location) {
        cleanup.location = "";
      }
      if (validationErrors.places) {
        cleanup.places = 0;
      }
      setFilters((f) => ({ ...f, ...cleanup }));
    }
  }, [validationErrors]);
  const fmtCur = (v) => formatCurrency(v, lang, "EUR");
  const fmtDate = (iso) => formatDate(iso, lang);
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorDisplay,
      {
        title: t("errors.title"),
        message: t("errors.unexpected"),
        showRetry: true,
        retryButtonText: t("errors.retry"),
        onRetry: () => setFilters((f) => ({ ...f })),
        showHome: true,
        homeButtonText: t("errors.home")
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Seo, { title: t("tickets.seo_title"), description: t("tickets.seo_description") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PageWrapper, { disableCard: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h4", sx: { px: 2 }, children: t("tickets.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, p: 2 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProductsFilters, { filters, onChange: (upd) => setFilters((f) => ({ ...f, ...upd })) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { component: "main", flex: 1, children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { textAlign: "center", py: 8, children: /* @__PURE__ */ jsxRuntimeExports.jsx(OlympicLoader, {}) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ProductGrid, { products, fmtCur, fmtDate, onViewDetails: setDetailsId }),
          !loading && products.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { textAlign: "center", mt: 4, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Pagination,
            {
              count: Math.ceil(total / filters.perPage) || 1,
              page: filters.page,
              onChange: (_, p) => setFilters((f) => ({ ...f, page: p }))
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProductDetailsModal,
      {
        open: detailsId !== null,
        productId: detailsId,
        lang,
        onClose: () => setDetailsId(null)
      }
    )
  ] });
}
export {
  ProductsPage as default
};
//# sourceMappingURL=TicketsPage-v95tGpFX.js.map
