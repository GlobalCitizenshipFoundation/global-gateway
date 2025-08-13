import { createRoot } from "react-dom/client";
import App from "./App"; // Removed .tsx extension
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);