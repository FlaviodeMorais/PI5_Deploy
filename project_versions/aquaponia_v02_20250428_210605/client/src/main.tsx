import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add FontAwesome CSS
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
fontAwesomeLink.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
fontAwesomeLink.crossOrigin = 'anonymous';
fontAwesomeLink.referrerPolicy = 'no-referrer';
document.head.appendChild(fontAwesomeLink);

createRoot(document.getElementById("root")!).render(<App />);
