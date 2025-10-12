import React, { useEffect, useState } from "react";
import { useBuilder } from "@/lib/useBuilder";

export default function Background() {
  const { data, brief } = useBuilder();
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!brief) return;
      try {
        // ✅ Safely check for nested values to prevent 'undefined' errors
        const paletteArray = data?.theme?.palette
          ? Object.values(data.theme.palette)
          : [];

        const res = await fetch("/api/images/background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brief,
            palette: paletteArray,
          }),
        });

        const json = await res.json();
        if (!cancelled && json.ok && json.url) {
          setImgUrl(json.url);
        }
      } catch (err) {
        console.error("background fetch error", err);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [brief, data]);

  return (
    <>
      {/* Background image layer */}
      {imgUrl && (
        <div
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: `url(${imgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(1.05) contrast(1.02) brightness(0.9)",
          }}
        />
      )}
    </>
  );
}
