import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./pages/App";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import "./styles.css";
import "./i18n";

import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </App>
  </BrowserRouter>
);
