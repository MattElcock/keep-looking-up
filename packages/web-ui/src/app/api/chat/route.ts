import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";
import { log } from "@keep-looking-up/logger";

const systemPrompt = `
  You are an astronomy assistant. You have tools to look up asteroids, celestial bodies, and atmospheric conditions.
  Before fetching observation data, call getAtmosphericConditions first — if conditions are poor, tell the user and skip other tools.
`;

interface RequestJson {
  messages: UIMessage[];
  conversationId?: string;
}

type MCPHeaders = Record<string, string>;

const buildMCPHeaders = (token: string, conversationId: string): MCPHeaders => {
  return {
    Authorization: `Bearer ${token}`,
    "x-conversation-id": conversationId,
  };
};

const setupMCPClients = async (mcpHeaders: MCPHeaders) => {
  const clients = await Promise.all([
    createMCPClient({
      transport: {
        headers: mcpHeaders,
        type: "http",
        url: process.env.MCP_URL ?? "http://localhost:1337/mcp",
      },
    }),
    createMCPClient({
      transport: {
        headers: mcpHeaders,
        type: "http",
        url: process.env.MCP_CONDITIONS_URL ?? "http://localhost:1338/mcp",
      },
    }),
  ]);

  const toolArrays = await Promise.all(clients.map((client) => client.tools()));
  const tools = Object.assign({}, ...toolArrays);

  const closeClients = async () => {
    await Promise.all(clients.map(async (client) => await client.close()));
  };

  return { clients, tools, closeClients };
};

export const POST = async (req: Request) => {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL environment variable is not set.");

  const { messages, conversationId }: RequestJson = await req.json();

  if (!conversationId) {
    log({
      event: "chat.request.failed",
      conversationId: "unknown",
      userId: "unknown",
      error: "Missing conversationId in request body",
    });
    throw new Error("Missing conversationId in request body");
  }

  const { getToken, userId } = await auth();
  const token = await getToken();

  if (!token || !userId) {
    log({
      event: "chat.request.failed",
      conversationId,
      userId: "unknown",
      error: "Unauthorized",
    });
    throw new Error("Unauthorized");
  }

  log({
    event: "chat.request.received",
    conversationId,
    userId,
    messageCount: messages.length,
  });

  const mcpHeaders = buildMCPHeaders(token, conversationId);
  const { tools, closeClients } = await setupMCPClients(mcpHeaders);

  try {
    const result = streamText({
      model,
      tools,
      stopWhen: stepCountIs(5),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError: ({ error }) => {
        log({
          event: "chat.request.failed",
          conversationId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      },
      onStepFinish: ({
        toolCalls,
        toolResults,
        stepNumber,
        finishReason,
        text,
      }) => {
        log({
          event: "chat.step.finished",
          conversationId,
          userId,
          stepNumber,
          finishReason,
          response: text,
          toolCalls: toolCalls.map((tc) => ({
            name: tc.toolName,
            input: tc.input,
          })),
          toolResults: toolResults.map((tr) => ({
            name: tr.toolName,
            output: tr.output,
          })),
        });
      },
      onFinish: async ({ usage, steps, finishReason, text }) => {
        log({
          event: "chat.request.finished",
          conversationId,
          userId,
          finishReason,
          response: text,
          stepCount: steps.length,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
        });
        await closeClients();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    log({
      event: "chat.request.failed",
      conversationId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    await closeClients();
    throw error;
  }
};
