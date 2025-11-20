import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/auth/AuthContext.jsx";

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './styles/base.css'
// import './styles/navbar.css'
// import './styles/landing.css'
// import './styles/auth.css'
// import './styles/dashboard.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  //   <App />
  // </StrictMode>,

  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
