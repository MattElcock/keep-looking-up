export type ToolCall = { name: string; input: unknown };
export type ToolResult = { name: string; output?: unknown };

export type LogEvent =
  | { event: "chat.request.received"; conversationId: string; userId: string; messageCount: number }
  | { event: "chat.step.finished"; conversationId: string; userId: string; stepIndex: number; stepDurationMs: number; toolCalls: ToolCall[]; toolResults: ToolResult[] }
  | { event: "chat.request.finished"; conversationId: string; userId: string; totalDurationMs: number; stepCount: number; inputTokens: number; outputTokens: number }
  | { event: "chat.request.failed"; conversationId: string; userId: string; error: string }
  | { event: "mcp.request.received"; conversationId: string; userId: string; toolName?: string; toolArgs?: unknown }
  | { event: "mcp.request.finished"; conversationId: string; userId: string; durationMs: number; toolName?: string; toolArgs?: unknown };

export const log = (event: LogEvent): void => {
  console.log(JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
};
