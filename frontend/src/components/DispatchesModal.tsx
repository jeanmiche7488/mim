import { useState } from 'react'

interface Dispatch {
  id: string
  name: string
  created_at: string
}

interface DispatchesModalProps {
  dispatches: Dispatch[]
  onClose: () => void
}

export default function DispatchesModal({ dispatches, onClose }: DispatchesModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Dispatches liés</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {dispatches.map((dispatch) => (
              <li key={dispatch.id} className="py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{dispatch.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(dispatch.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 