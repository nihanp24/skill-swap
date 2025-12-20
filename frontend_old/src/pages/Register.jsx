import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [form, setForm] = useState({ name:'', email:'', password:'', skills:'' })
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      const payload = { name: form.name, email: form.email, password: form.password, skills: form.skills.split(',').map(s=>s.trim()).filter(Boolean) }
      const res = await axios.post('http://localhost:5000/api/auth/register', payload, { withCredentials: true })
      nav('/dashboard')
    }catch(err){
      setError(err?.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Create account</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="w-full p-2 border rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input type="password" className="w-full p-2 border rounded" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <input className="w-full p-2 border rounded" placeholder="Skills (comma separated) e.g. guitar,spanish" value={form.skills} onChange={e=>setForm({...form, skills:e.target.value})} />
        <button className="w-full py-2 bg-blue-600 text-white rounded">Register</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  )
}
