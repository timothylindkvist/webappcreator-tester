'use client'
import { useEffect } from 'react'
export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      {error?.digest && <p className="mt-2 text-sm opacity-70">Request ID: <code>{error.digest}</code></p>}
      <button className="mt-4 px-4 py-2 rounded bg-gray-200" onClick={() => reset()}>Try again</button>
    </div>
  )
}
