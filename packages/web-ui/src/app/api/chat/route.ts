import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";
import { log } from "@keep-looking-up/logger";

interface RequestJson {
  messages: UIMessage[];
  conversationId?: string;
}

export const POST = async (req: Request) => {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL environment variable is not set.");

  const { messages, conversationId }: RequestJson = await req.json();
  if (!conversationId) {
    throw new Error("Missing conversationId in request body");
  }

  const { getToken, userId } = await auth();
  if (!userId) {
    throw new Error("Missing userId");
  }
  const token = await getToken();

  log({
    event: "chat.request.received",
    conversationId,
    userId: userId,
    messageCount: messages.length,
  });

  const mcpHeaders = {
    Authorization: `Bearer ${token}`,
    "x-conversation-id": conversationId,
  };

  const [observationsClient, conditionsClient] = await Promise.all([
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

  const closeClients = async () => {
    await Promise.allSettled([
      observationsClient?.close(),
      conditionsClient?.close(),
    ]);
  };

  const [observationTools, conditionTools] = await Promise.all([
    observationsClient.tools(),
    conditionsClient.tools(),
  ]);

  const tools = { ...observationTools, ...conditionTools };

  const requestStart = Date.now();
  let stepIndex = 0;
  let stepStart = requestStart;

  const result = streamText({
    model,
    tools,
    stopWhen: stepCountIs(5),
    system:
      "You are an astronomy assistant. You have tools to look up asteroids, celestial bodies, and atmospheric conditions. Before fetching observation data, call getAtmosphericConditions first — if conditions are poor, tell the user and skip other tools.",
    messages: await convertToModelMessages(messages),
    onError: ({ error }) => {
      log({
        event: "chat.request.failed",
        conversationId,
        userId: userId ?? "unknown",
        error: error instanceof Error ? error.message : String(error),
      });
    },
    onStepFinish: ({ toolCalls, toolResults }) => {
      const now = Date.now();
      log({
        event: "chat.step.finished",
        conversationId,
        userId: userId ?? "unknown",
        stepIndex: stepIndex++,
        stepDurationMs: now - stepStart,
        toolCalls: toolCalls.map((tc) => ({
          name: tc.toolName,
          input: tc.input,
        })),
        toolResults: toolResults.map((tr) => ({ name: tr.toolName })),
      });
      stepStart = now;
    },
    onFinish: async ({ usage, steps }) => {
      log({
        event: "chat.request.finished",
        conversationId,
        userId: userId ?? "unknown",
        totalDurationMs: Date.now() - requestStart,
        stepCount: steps.length,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      });
      await closeClients();
    },
  });

  return result.toUIMessageStreamResponse();
};
