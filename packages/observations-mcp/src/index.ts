import "dotenv/config";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { log } from "@keep-looking-up/logger";
import registerToolListAsteroidsCloseToEarth from "./tools/listAsteroidsCloseToEarth.js";
import registerToolGetAsteroid from "./tools/getAsteroid.js";
import registerToolListBodiesAboveHorizon from "./tools/listBodiesAboveHorizon.js";

const app = express();

app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());

const requireClerkAuth = (req: Request, res: Response, next: NextFunction) => {
  const { isAuthenticated } = getAuth(req);
  if (!isAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

const createMcpServer = (): McpServer => {
  const server = new McpServer({
    name: "observations-mcp",
    version: "0.1.0",
  });

  registerToolListAsteroidsCloseToEarth(server);
  registerToolGetAsteroid(server);
  registerToolListBodiesAboveHorizon(server);

  return server;
};

app.post("/mcp", requireClerkAuth, async (req, res) => {
  const rawHeader = req.headers["x-conversation-id"];
  const conversationId = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader) ?? "unknown";
  const { userId: rawUserId } = getAuth(req);
  const userId = rawUserId ?? "unknown";
  const isToolCall = req.body?.method === "tools/call";
  const toolName = isToolCall ? (req.body?.params?.name as string | undefined) : undefined;
  const toolArgs = isToolCall ? req.body?.params?.arguments : undefined;
  const start = Date.now();

  log({ event: "mcp.request.received", conversationId, userId, toolName, toolArgs });

  res.on("finish", () => {
    log({ event: "mcp.request.finished", conversationId, userId, durationMs: Date.now() - start, toolName, toolArgs });
  });

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Observations MCP running on http://localhost:${PORT}`);
  console.log(`MCP endpoint:  POST http://localhost:${PORT}/mcp`);
});