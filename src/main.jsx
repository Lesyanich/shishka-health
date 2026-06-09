import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { Landing } from "./components/landing/Landing.jsx";
import { CartProvider } from "./state/cart.jsx";

/*
  Splash gate: the royal-green landing page shows first; "Enter the menu"
  reveals the site. Timing is intentionally simple for now (shows on each fresh
  load) — we'll tune how often it appears once the design is signed off.
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
