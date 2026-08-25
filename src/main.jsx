import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import MenuBoard from "./components/board/MenuBoard.jsx";
import { CartProvider } from "./state/cart.jsx";
import { SlicerProvider } from "./state/slicer.jsx";

/* /board is the screen bolted to the wall in the restaurant — a full-screen
   dish slideshow, not a page a guest navigates to. There is no router on this
   site (one page, anchor-scrolled), so the one non-menu surface is switched on
   the pathname here rather than by pulling in a routing dependency for it.
   Vercel's SPA catch-all already serves index.html for the URL. */
const isBoard = window.location.pathname.replace(/\/+$/, "") === "/board";

/* Splash gate removed: visitors land straight on the menu — the hero carries
   the brand statement. (Landing splash component/styles deleted 2026-06-12.) */
function Root() {
  return isBoard ? <MenuBoard /> : <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      {/* The slice counter is self-contained — it feeds nothing but its own
          readout, and deliberately does not touch the order. */}
      <SlicerProvider>
        <Root />
      </SlicerProvider>
    </CartProvider>
  </StrictMode>
);
