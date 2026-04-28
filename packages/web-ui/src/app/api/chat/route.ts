import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";
import { log } from "@keep-looking-up/logger";

export const POST = async (req: Request) => {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL environment variable is not set.");

  const { messages, conversationId = "unknown" }: { messages: UIMessage[]; conversationId?: string } =
    await req.json();

  const { getToken, userId } = await auth();
  const token = await getToken();

  log({
    event: "chat.request.received",
    conversationId,
    userId: userId ?? "unknown",
    messageCount: messages.length,
  });

  const mcpClient = await createMCPClient({
    transport: {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-conversation-id": conversationId,
      },
      type: "http",
      url: process.env.MCP_URL ?? "http://localhost:1337/mcp",
    },
  });

  const tools = await mcpClient.tools();
  const requestStart = Date.now();
  let stepIndex = 0;
  let stepStart = requestStart;

  try {
    const result = streamText({
      model,
      tools,
      stopWhen: stepCountIs(5),
      system:
        "You are an astronomy assistant. You have tools to look up asteroids and celestial bodies visible from a given location. Use them proactively to answer questions — don't ask for permission, just fetch the data.",
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
          toolCalls: toolCalls.map((tc) => ({ name: tc.toolName, input: tc.input })),
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
        await mcpClient.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    log({
      event: "chat.request.failed",
      conversationId,
      userId: userId ?? "unknown",
      error: error instanceof Error ? error.message : String(error),
    });
    await mcpClient.close();
    throw error;
  }
};
