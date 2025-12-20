import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [visible, setVisible] = useState(false);

  // 🚀 Auto redirect logged-in users
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  // ✨ Trigger fade-in animation
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Navbar */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-4 z-20">
        <h1
          className="text-2xl font-extrabold tracking-wide cursor-pointer"
          onClick={() => navigate("/")}
        >
          Talent<span className="text-yellow-300">Trade</span>
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
          >
            Join Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main
        className={`relative z-10 text-center max-w-3xl px-6 transform transition-all duration-1000 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h2 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-md mb-6">
          Exchange <span className="text-yellow-300">Skills</span>, Not Money
        </h2>
        <p className="text-lg md:text-xl text-gray-100 mb-8">
          Connect with others to teach and learn valuable skills without spending a dime.{" "}
          Share your talents and gain new ones in a trusted community.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 bg-yellow-400 text-black font-semibold text-lg rounded-lg hover:bg-yellow-300 transition shadow-lg animate-pulse"
        >
          Get Started
        </button>
      </main>

      {/* Background Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-sm text-gray-300">
        © {new Date().getFullYear()} TalentTrade. All rights reserved.
      </footer>
    </div>
  );
}
