import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard(){
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')

  useEffect(()=>{
    fetchMe()
    fetchUsers()
  },[])

  const fetchMe = async () => {
    try{
      const res = await axios.get('http://localhost:5000/api/auth/me', { withCredentials: true })
      setMe(res.data.user)
    }catch(e){ setMe(null) }
  }

  const fetchUsers = async (search='') => {
    try{
      const res = await axios.get('http://localhost:5000/api/users' + (search?`?search=${encodeURIComponent(search)}`:''))
      setUsers(res.data.users)
    }catch(e){ setUsers([]) }
  }

  const onSearch = (e) => {
    const val = e.target.value
    setQ(val)
    fetchUsers(val)
  }

  const logout = async () => {
    await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true })
    window.location.href = '/'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div>
          {me ? <span className="mr-4">Hi, {me.name}</span> : <a href="/login">Login</a>}
          <button onClick={logout} className="bg-gray-200 px-3 py-1 rounded">Logout</button>
        </div>
      </div>

      <div className="mb-4">
        <input value={q} onChange={onSearch} placeholder="Search by name or skill" className="w-full p-2 border rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map(u=>(
          <div key={u.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{u.name}</div>
                <div className="text-sm text-gray-600">{u.email}</div>
              </div>
              <div className="text-sm text-gray-500">{(u.skills || []).join(', ')}</div>
            </div>
            {u.bio && <div className="mt-2 text-gray-700">{u.bio}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
