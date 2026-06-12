import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { Landing } from "./components/landing/Landing.jsx";
import { CartProvider } from "./state/cart.jsx";

/*
  Splash gate: the landing page shows first; "Enter the site" reveals the menu.
  Shows on each fresh load. (Restored after the 2026-06-11 removal.)
*/
function Root() {
  const [entered, setEntered] = useState(false);
  if (!entered) return <Landing onEnter={() => setEntered(true)} />;
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CartProvider>
      <Root />
    </CartProvider>
  </StrictMode>
);
