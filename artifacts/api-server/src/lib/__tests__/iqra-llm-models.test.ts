import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => {
  process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ??= "http://127.0.0.1:9";
  process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ??= "test-key";
  return { create: vi.fn() };
});

vi.mock("@workspace/integrations-anthropic-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/integrations-anthropic-ai")>();
  return { ...actual, anthropic: { messages: { create } } };
});
const { logger } = vi.hoisted(() => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("../logger.js", () => ({ logger }));

const { Anthropic } = await import("@workspace/integrations-anthropic-ai");

function reply(model: string, stop_reason: string = "end_turn") {
  return { model, stop_reason, content: [{ type: "text", text: `from ${model}` }] };
}
function apiError(status: number, message: string) {
  return Anthropic.APIError.generate(status, { error: { message } }, message, new Headers());
}

let createChatMessage: typeof import("../iqra-llm.js").createChatMessage;

beforeEach(async () => {
  create.mockReset();
  logger.info.mockReset();
  vi.resetModules(); // fresh "unavailable model" memory per test
  ({ createChatMessage } = await import("../iqra-llm.js"));
});

const params = { max_tokens: 100, messages: [{ role: "user" as const, content: "hi" }] };

describe("createChatMessage", () => {
  it("asks Claude Sonnet 5.5 first, at low effort", async () => {
    create.mockResolvedValueOnce(reply("claude-sonnet-5-5"));
    const message = await createChatMessage(params);
    expect(message.model).toBe("claude-sonnet-5-5");
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]![0]).toMatchObject({ model: "claude-sonnet-5-5", output_config: { effort: "low" } });
    expect(logger.info).toHaveBeenCalledWith({ model: "claude-sonnet-5-5" }, "Answered with claude-sonnet-5-5");
  });

  it("falls back to Claude Sonnet 5 when 5.5 isn't offered, and remembers it", async () => {
    create
      .mockRejectedValueOnce(apiError(404, "model: claude-sonnet-5-5"))
      .mockResolvedValueOnce(reply("claude-sonnet-5"))
      .mockResolvedValueOnce(reply("claude-sonnet-5"));
    expect((await createChatMessage(params)).model).toBe("claude-sonnet-5");
    expect((await createChatMessage(params)).model).toBe("claude-sonnet-5");
    expect(create.mock.calls.map((call) => call[0].model)).toEqual(["claude-sonnet-5-5", "claude-sonnet-5", "claude-sonnet-5"]);
  });

  it("also falls back on a 400 that names the model (proxy-style rejection)", async () => {
    create
      .mockRejectedValueOnce(apiError(400, "Model claude-sonnet-5-5 is not supported"))
      .mockResolvedValueOnce(reply("claude-sonnet-5"));
    expect((await createChatMessage(params)).model).toBe("claude-sonnet-5");
  });

  it("retries a refusal on the fallback model", async () => {
    create.mockResolvedValueOnce(reply("claude-sonnet-5-5", "refusal")).mockResolvedValueOnce(reply("claude-sonnet-5"));
    const message = await createChatMessage(params);
    expect(message.model).toBe("claude-sonnet-5");
    expect(message.stop_reason).toBe("end_turn");
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith({ model: "claude-sonnet-5" }, "Answered with claude-sonnet-5");
  });

  it("does not hide real failures such as outages or rate limits", async () => {
    create.mockRejectedValueOnce(apiError(529, "Overloaded"));
    await expect(createChatMessage(params)).rejects.toThrow("Overloaded");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("surfaces an error when the last model is unavailable too", async () => {
    create
      .mockRejectedValueOnce(apiError(404, "model: claude-sonnet-5-5"))
      .mockRejectedValueOnce(apiError(404, "model: claude-sonnet-5"));
    await expect(createChatMessage(params)).rejects.toThrow("claude-sonnet-5");
  });
});
