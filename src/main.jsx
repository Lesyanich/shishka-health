import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { CartProvider } from "./state/cart.jsx";

/* Splash gate removed: visitors land straight on the menu — the hero carries
   the brand statement. (Landing splash component/styles deleted 2026-06-12.) */
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
