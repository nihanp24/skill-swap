import React from 'react'
export default function Home(){
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-extrabold">Talent Trade</h1>
      <p className="mt-4 text-gray-600">Exchange skills. Grow together.</p>
      <div className="mt-8">
        <a href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-lg">Get started</a>
      </div>
    </div>
  )
}
