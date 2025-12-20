import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { queryClient } from "./config/queryClient";
import NotificationContainer from "./components/ui/Notification/NotificationContainer";
import GlobalPrefetch from "./components/GlobalPrefetch";
import { useWebSocket } from "./hooks/useWebSocket";
import App from './App';
import './index.css';

// Initialize auth store on app load
function AppWithInit() {
  const initialize = useAuthStore((state) => state.initialize);
  
  // Initialize WebSocket connection
  useWebSocket();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <GlobalPrefetch />
      <App />
      <NotificationContainer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppWithInit />
      </QueryClientProvider>
    </BrowserRouter>
  // </React.StrictMode>
);
