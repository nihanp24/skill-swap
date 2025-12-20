import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [form, setForm] = useState({ email:'', password:'' })
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      const res = await axios.post('http://localhost:5000/api/auth/login', { email: form.email, password: form.password }, { withCredentials: true })
      nav('/dashboard')
    }catch(err){
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button className="w-full py-2 bg-blue-600 text-white rounded">Login</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  )
}
