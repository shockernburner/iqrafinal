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
  const usage = { input_tokens: 7600, output_tokens: 1100, cache_read_input_tokens: 2000, cache_creation_input_tokens: 0 };
  return { model, stop_reason, usage, content: [{ type: "text", text: `from ${model}` }] };
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
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-5-5", cache_read_input_tokens: 2000, output_tokens: 1100 }),
      "Answered with claude-sonnet-5-5",
    );
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
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ model: "claude-sonnet-5" }), "Answered with claude-sonnet-5");
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

  it("sends the system prompt with a cache marker for the answer call", async () => {
    create.mockResolvedValueOnce({
      ...reply("claude-sonnet-5-5"),
      content: [{ type: "text", text: JSON.stringify({ answer: "ok", framework: [], sourceLinks: [], confidence: "high" }) }],
    });
    const { generateLlmChatResponse } = await import("../iqra-llm.js");
    await generateLlmChatResponse("What are the rights of neighbors?", [], []).catch(() => undefined);
    const system = create.mock.calls[0]![0].system;
    expect(Array.isArray(system)).toBe(true);
    expect(system[0]).toMatchObject({ type: "text", cache_control: { type: "ephemeral" } });
    expect(system[0].text.length).toBeGreaterThan(5000);
  });
});

describe("English search terms for non-English questions", () => {
  it("detects questions written in a non-Latin script", async () => {
    const { needsEnglishSearchTerms } = await import("../iqra-llm.js");
    expect(needsEnglishSearchTerms("বারযাখে মানুষ কীভাবে থাকে?")).toBe(true);
    expect(needsEnglishSearchTerms("ما هو البرزخ؟")).toBe(true);
    expect(needsEnglishSearchTerms("What is barzakh?")).toBe(false);
    expect(needsEnglishSearchTerms("Qu'est-ce que la prière à la mosquée ?")).toBe(false);
  });

  it("asks the smallest model, without effort settings, and returns one line of terms", async () => {
    create.mockResolvedValueOnce({
      model: "claude-haiku-4-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 180, output_tokens: 20 },
      content: [{ type: "text", text: "barzakh soul\nafterlife  resurrection qiyamah" }],
    });
    const { englishSearchTerms } = await import("../iqra-llm.js");
    expect(await englishSearchTerms("বারযাখে মানুষ কীভাবে থাকে?")).toBe("barzakh soul afterlife resurrection qiyamah");
    const params = create.mock.calls[0]![0];
    expect(params.model).toBe("claude-haiku-4-5");
    expect(params.output_config).toBeUndefined();
    expect(create.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
  });

  it("returns null instead of failing the answer when the call errors", async () => {
    create.mockRejectedValueOnce(apiError(529, "Overloaded"));
    const { englishSearchTerms } = await import("../iqra-llm.js");
    expect(await englishSearchTerms("বারযাখ কী?")).toBeNull();
  });
});
