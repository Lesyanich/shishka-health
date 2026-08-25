import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import MenuBoard from "./components/board/MenuBoard.jsx";
import BuildBoard from "./components/board/BuildBoard.jsx";
import { CartProvider } from "./state/cart.jsx";
import { SlicerProvider } from "./state/slicer.jsx";

/* /board is the screen bolted to the wall in the restaurant — a full-screen
   dish slideshow, not a page a guest navigates to. There is no router on this
   site (one page, anchor-scrolled), so the one non-menu surface is switched on
   the pathname here rather than by pulling in a routing dependency for it.
   Vercel's SPA catch-all already serves index.html for the URL. */
const isBoard = window.location.pathname.replace(/\/+$/, "") === "/board";

/* Two boards, one wall.

   /board            the build-your-own guide — four steps, the concept the
                     restaurant is being rebuilt around (2026-08-25).
   /board?mode=dishes the dish reel — one plate at a time, full bleed.

   BYO is the default because the wall's job changed: a guest standing in a
   build-your-own queue for the first time needs to be told what to do before
   they need to be sold a plate. The dish reel is not retired — it is the right
   board for a quiet evening service, and it stays one query string away so the
   two can be A/B'd on the actual panel rather than argued about in a doc. */
const boardMode = new URLSearchParams(window.location.search).get("mode");
const Board = boardMode === "dishes" ? MenuBoard : BuildBoard;

/* Splash gate removed: visitors land straight on the menu — the hero carries
   the brand statement. (Landing splash component/styles deleted 2026-06-12.) */
function Root() {
  return isBoard ? <Board /> : <App />;
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
