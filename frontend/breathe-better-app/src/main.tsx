import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before render to prevent flash
const theme = localStorage.getItem("theme") || "system";
const root = document.documentElement;
if (theme === "dark") root.classList.add("dark");
else if (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
