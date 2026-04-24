# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev --workspace=packages/observations-mcp
npm run typecheck --workspace=packages/observations-mcp
```

Always run `typecheck` after making changes.

## Code style

### Tool files

Each tool file exports a single `registerXxxTool(server: McpServer)` function. Tool name, description, Zod input schema, and handler are all defined inline inside `registerTool` — don't extract them to separate constants.

Tool descriptions should describe what the tool does and when to use it. Don't mention the underlying API — that's an implementation detail.

Always include `id` on returned objects so the AI can pass it to follow-up tools (e.g. `listAsteroids` returns IDs the AI passes to `getAsteroid`).

### API files

Each API file has a private `ApiResponse` interface mirroring the raw API shape, a private domain interface extending `BaseAsteroid`, and a private `processFetchedData` function mapping one to the other. Only the main async function (e.g. `listAsteroids`) is exported.

Raw API fields that are strings but represent numbers must be `parseFloat`/`parseInt` in the mapping — never return them as strings.

### Types

Shared types used across multiple files in the same API go in `types.ts`. Types only used in one file stay local to that file. Use `extends` to build on shared base types rather than duplicating fields.

Output field names should be human-readable and self-describing (e.g. `distanceLunar`, `timeToOrbitSunDays`) — the AI reads these as JSON keys without additional context, so they should convey meaning on their own.

### Architecture

Each MCP server follows the same structure:

```
src/
  index.ts          # Express app and route wiring only — just calls registerXxxTool(server)
  tools/            # One file per tool
  apis/
    <api-name>/
      types.ts      # Shared interfaces only
      <endpoint>.ts # One file per API endpoint
```

`packages/_template-mcp` is a bootstrapping template — copy it when creating a new MCP server.