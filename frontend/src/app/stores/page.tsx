'use client'

import Navigation from '@/components/Navigation'
import StoresTable from '@/components/StoresTable'

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Magasins</h1>
            <StoresTable />
          </div>
        </div>
      </main>
    </div>
  )
} 