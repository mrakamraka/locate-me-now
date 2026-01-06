import { Buffer } from "buffer";

// Polyfill Buffer for bip39 library (required for browser environment)
window.Buffer = Buffer;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
