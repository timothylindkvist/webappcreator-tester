'use client';
import { useState } from 'react';

export default function Builder() {
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState('');

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/build', { method: 'POST', body: JSON.stringify({ brief }) });
    const data = await res.json();
    setSite(data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <textarea value={brief} onChange={e=>setBrief(e.target.value)} placeholder="Describe your site" className="border p-2 w-full" />
      <button onClick={generate} disabled={loading} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        {loading ? 'Generating...' : 'Generate Site'}
      </button>
      {site && <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">{JSON.stringify(site,null,2)}</pre>}
    </div>
  );
}
