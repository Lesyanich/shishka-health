import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { CartProvider } from "./state/cart.jsx";

/* Splash gate removed (CEO call 2026-06-11): visitors land straight on the
   menu — the hero carries the brand statement. Landing.jsx kept for reuse. */
function Root() {
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <Root />
    </CartProvider>
  </StrictMode>
);
