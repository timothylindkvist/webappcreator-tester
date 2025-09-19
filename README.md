# Sidesmith

Chat-first website creator. The **first message** builds the initial site from your brief. Every **next message** applies edits via OpenAI tool calls.

## Env
- OPENAI_API_KEY
- OPENAI_MODEL (optional, defaults to gpt-5)

## Dev
- The chat calls `/api/chat` (Responses API with tool-calls). 
- No fallbacks: if the API errors, the UI shows the error.


### Flexible Sections
This update introduces an ordered `blocks` array with tools: setSections, insertSection, updateSection, moveSection, deleteSection. The renderer prefers `blocks` if present, otherwise falls back to the legacy fixed sections.
