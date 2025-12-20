// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import ProfilePublic from "./pages/ProfilePublic";
import Landing from "./pages/Landing";

export default function App() {
  const location = useLocation();

  // Hide Navbar only on the landing page for a clean hero layout
  const hideNavbar = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ✅ Show Navbar everywhere except Landing */}
      {!hideNavbar && <Navbar />}

      <main className="max-w-6xl mx-auto p-6 flex-1 w-full">
        <Routes>
          {/* 🏠 Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* 🔐 Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔒 Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <ProfilePublic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* 🧭 Fallback — redirect unknown routes to Landing */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
    </div>
  );
}
