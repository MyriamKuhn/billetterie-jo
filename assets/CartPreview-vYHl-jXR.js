import { R as React, j as jsxRuntimeExports } from "./react-C7MzU9h5.js";
import { S as ShoppingCartIcon } from "./mui-icons-VgAuV1_h.js";
import { a as useCartStore } from "./index-BBST7aK2.js";
import { u as useTranslation } from "./i18n-react-iba5hpPF.js";
import { k as IconButton, z as Badge, a5 as Popover, T as Typography, w as Box, e as List, L as ListItem, t as ListItemText, B as Button } from "./mui-core-DnbKJ2D6.js";
import { aH as Link } from "./vendor-_1F4LxCW.js";
import "./dayjs-BiUQzNTY.js";
import "./i18n-core-CZXZtM2N.js";
import "./i18n-detector-CbwplsEi.js";
import "./i18n-backend-C6XrdI17.js";
import "./zustand-D4l4ryit.js";
import "./emotion-react-DpnJiwaH.js";
import "./cookie-consent-D08ijo9N.js";
import "./mui-pickers-BIgWd71z.js";
import "./emotion-styled-BZvaByh5.js";
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
//# sourceMappingURL=CartPreview-vYHl-jXR.js.map
