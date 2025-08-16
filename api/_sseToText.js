// api/_sseToText.js
// Parse OpenAI Chat Completions SSE and return a ReadableStream of plain text content deltas.
export function sseToTextStream(sseBody) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = sseBody.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          let idx;
          while ((idx = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);

            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith("data:")) {
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(payload);
                const delta = json?.choices?.[0]?.delta?.content ?? "";
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch (e) {
                // Non-JSON line; ignore
              }
            }
          }
        }
        // Flush remaining buffer line
        if (buffer.trim().startsWith("data:")) {
          const payload = buffer.trim().slice(5).trim();
          if (payload && payload !== "[DONE]") {
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {}
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return stream;
}
