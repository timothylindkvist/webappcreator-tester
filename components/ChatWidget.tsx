'use client';
import { useState } from 'react';
import { useBuilder } from './builder-context';

export default function ChatWidget() {
  const { brief, setBrief, rebuild } = useBuilder();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await rebuild();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="h-full flex flex-col rounded-2xl border p-4">
      <label className="text-sm font-medium mb-2">Website brief</label>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="e.g., 'Landing page for a yoga studio in Stockholm...'"
        className="flex-1 resize-none border rounded p-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 rounded bg-black text-white py-2 disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate site'}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </form>
  );
}
