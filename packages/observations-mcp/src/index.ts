import "dotenv/config";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import registerToolListAsteroidsCloseToEarth from "./tools/listAsteroidsCloseToEarth.js";
import registerToolGetAsteroid from "./tools/getAsteroid.js";
import registerToolListBodiesAboveHorizon from "./tools/listBodiesAboveHorizon.js";

const app = express();

app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());

function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  const { isAuthenticated } = getAuth(req);
  if (!isAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ------------------------------------------------------------------
// MCP server
// ------------------------------------------------------------------

// A new McpServer instance is required per request — the SDK does not support
// reconnecting a single instance to multiple transports.
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "observations-mcp",
    version: "0.1.0",
  });

  registerToolListAsteroidsCloseToEarth(server);
  registerToolGetAsteroid(server);
  registerToolListBodiesAboveHorizon(server);

  return server;
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

// A fresh server + transport is created per request (SDK does not support reuse)
app.post("/mcp", requireClerkAuth, async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Observations MCP running on http://localhost:${PORT}`);
  console.log(`MCP endpoint:  POST http://localhost:${PORT}/mcp`);
});