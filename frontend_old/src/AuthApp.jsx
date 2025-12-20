import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(res => setUser(res.data.user || null)).catch(()=>setUser(null)).finally(()=>setLoading(false));
  }, []);

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    if (res.data?.user) setUser(res.data.user);
    return res.data;
  };

  const login = async (data) => {
    const res = await api.post("/auth/login", data);
    if (res.data?.user) setUser(res.data.user);
    return res.data;
  };

  const logout = async () => { await api.post("/auth/logout").catch(()=>{}); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, register, login, logout }}>{children}</AuthContext.Provider>;
}

function Field({ label, ...props }) {
  return (
    <label className="block text-sm mb-2">
      <div className="mb-1 text-gray-700">{label}</div>
      <input className="w-full px-3 py-2 border rounded-md" {...props} />
    </label>
  );
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try { await register(form); navigate("/dashboard"); }
    catch (e) { setErr(e.response?.data?.error || "Failed to register"); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl mb-4 font-bold">Create account</h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Field label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {err && <div className="text-red-600">{err}</div>}
        <button className="w-full py-2 bg-indigo-600 text-white rounded">Register</button>
      </form>
      <div className="text-sm mt-3 text-center">
        Already have an account? <a href="/login" className="text-indigo-600">Login</a>
      </div>
    </div>
  );
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try { await login(form); navigate("/dashboard"); }
    catch (e) { setErr(e.response?.data?.error || "Login failed"); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl mb-4 font-bold">Sign in</h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username or Email" value={form.usernameOrEmail} onChange={e => setForm({ ...form, usernameOrEmail: e.target.value })} />
        <Field label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {err && <div className="text-red-600">{err}</div>}
        <button className="w-full py-2 bg-indigo-600 text-white rounded">Login</button>
      </form>
      <div className="text-sm mt-3 text-center">
        New here? <a href="/register" className="text-indigo-600">Create account</a>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow text-center">
      <h1 className="text-xl font-bold mb-3">Welcome, {user?.username}</h1>
      <button onClick={logout} className="px-4 py-2 border rounded">Logout</button>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function AuthApp() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
