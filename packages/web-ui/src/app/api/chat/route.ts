import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL environment variable is not set.");

  const { messages }: { messages: UIMessage[] } = await req.json();

  const { getToken } = await auth();
  const token = await getToken();

  const mcpClient = await createMCPClient({
    transport: {
      headers: { Authorization: `Bearer ${token}` },
      type: "http",
      url: process.env.MCP_URL ?? "http://localhost:1337/mcp",
    },
  });

  const tools = await mcpClient.tools();

  const result = streamText({
    model,
    tools,
    stopWhen: stepCountIs(5),
    system:
      "You are an astronomy assistant. You have tools to look up asteroids and celestial bodies visible from a given location. Use them proactively to answer questions — don't ask for permission, just fetch the data.",
    messages: await convertToModelMessages(messages),
    onFinish: async () => {
      await mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse();
}
