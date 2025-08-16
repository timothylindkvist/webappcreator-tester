import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // const { prompt } = await req.json();
  // TODO: call your model/provider here and return generated HTML/CSS/JS
  return NextResponse.json({ ok: true, html: "<h1>Generated</h1>", css: "h1{color:white}" });
}
