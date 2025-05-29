import { R as React, j as jsxRuntimeExports } from "./react-B5lGuWoF.js";
import { I as IconButton, j as Badge, k as ShoppingCartIcon, a6 as Popover, n as Typography, g as Box, i as List, a7 as ListItem, b as ListItemText, B as Button } from "./mui-DWveJqef.js";
import { a as useCartStore } from "./index-BWHHJaxl.js";
import { u as useTranslation } from "./i18n-react-BxR3PRIo.js";
import { Y as Link } from "./vendor-RytlYodM.js";
import "./dayjs-BiUQzNTY.js";
import "./emotion-z7-Z7b9V.js";
import "./i18n-CZXZtM2N.js";
import "./zustand-D1Pg-hUW.js";
import "./cookie-consent-DBm7SuCD.js";
function CartPreview() {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const id = open ? "cart-popover" : void 0;
  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      IconButton,
      {
        "aria-describedby": id,
        onClick: handleOpen,
        color: "inherit",
        "aria-label": t("navbar.cart"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Badge,
          {
            badgeContent: cartCount,
            color: "info",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCartIcon, {})
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Popover,
      {
        id,
        open,
        anchorEl,
        onClose: handleClose,
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        transformOrigin: { vertical: "top", horizontal: "right" },
        PaperProps: { sx: { width: 300, p: 1 } },
        children: cartCount === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { p: 2 }, variant: "body2", children: t("cart.empty") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(List, { dense: true, children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(ListItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            ListItemText,
            {
              primary: item.name,
              secondary: `${item.quantity} × ${item.price.toFixed(2)} €`
            }
          ) }, item.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", p: 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "subtitle1", children: [
              t("cart.total"),
              " : ",
              items.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2),
              " €"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                component: Link,
                to: "/cart",
                variant: "contained",
                size: "small",
                onClick: handleClose,
                children: t("cart.view")
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  CartPreview as default
};
//# sourceMappingURL=CartPreview-DOy--fct.js.map
