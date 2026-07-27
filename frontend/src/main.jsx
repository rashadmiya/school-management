
import { Toaster } from "@/components/ui/sonner"; // ✅ shadcn toaster
import "antd/dist/reset.css";
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthHydrator from "./features/authHydrator";
import ReduxStoreProvider from './features/store';
import './index.css'; // <-- Import Tailwind styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <ReduxStoreProvider>
    <AuthHydrator />
    <App />
    <Toaster /> {/* ✅ ONE TIME, GLOBAL */}
  </ReduxStoreProvider>
);

// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
