import { convertToModelMessages, streamText, UIMessage } from "ai";

export async function POST(req: Request) {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL environment variable is not set.");

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
