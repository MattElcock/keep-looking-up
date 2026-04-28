import { describe, it, expect, vi, afterEach } from "vitest";
import { log } from "./index.js";

describe("log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes exactly one JSON line to stdout per call", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({ event: "mcp.request.received", conversationId: "conv_1", userId: "user_1" });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("includes a valid ISO 8601 timestamp", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({ event: "mcp.request.received", conversationId: "conv_1", userId: "user_1" });
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("spreads all event fields into the output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({
      event: "chat.request.finished",
      conversationId: "conv_2",
      userId: "user_2",
      totalDurationMs: 1200,
      stepCount: 2,
      promptTokens: 100,
      completionTokens: 50,
    });
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      event: "chat.request.finished",
      conversationId: "conv_2",
      userId: "user_2",
      totalDurationMs: 1200,
      stepCount: 2,
      promptTokens: 100,
      completionTokens: 50,
    });
  });

  it("accepts a chat.step.finished event with tool arrays", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log({
      event: "chat.step.finished",
      conversationId: "conv_3",
      userId: "user_3",
      stepIndex: 0,
      stepDurationMs: 800,
      toolCalls: [{ name: "listAsteroidsCloseToEarth", input: { start_date: "2026-04-28", end_date: "2026-05-05" } }],
      toolResults: [{ name: "listAsteroidsCloseToEarth", output: { count: 5 } }],
    });
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.toolCalls[0].name).toBe("listAsteroidsCloseToEarth");
    expect(parsed.toolResults[0].output).toEqual({ count: 5 });
  });

  it("timestamp is injected automatically and is always a recent value", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const before = Date.now();
    log({ event: "mcp.request.received", conversationId: "conv_1", userId: "user_1" });
    const after = Date.now();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    const ts = new Date(parsed.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
