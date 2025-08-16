import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (typeof html !== "string" || html.length < 10) {
    return NextResponse.json({ error: "No HTML supplied" }, { status: 400 });
  }
  const zip = new JSZip();
  // ensure a doctype
  const doc = html.trim().startsWith("<!DOCTYPE") ? html.trim() : "<!DOCTYPE html>\n" + html.trim();
  zip.file("index.html", doc);
  const file = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=influencer-site.zip",
    },
  });
}
