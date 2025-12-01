import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import NotificationContainer from "./components/ui/Notification/NotificationContainer";
import App from './App';
import './index.css';

// Initialize auth store on app load
function AppWithInit() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <App />
      <NotificationContainer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithInit />
    </BrowserRouter>
  </React.StrictMode>
);
