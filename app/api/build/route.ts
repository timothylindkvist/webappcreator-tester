import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { brief } = await req.json();
  const demo = {
    hero: { title: "Demo Site", subtitle: "Generated for: " + brief, cta: { label: "Contact us" } },
  };
  return new Response(JSON.stringify(demo), { status: 200, headers: { 'content-type': 'application/json' } });
}
