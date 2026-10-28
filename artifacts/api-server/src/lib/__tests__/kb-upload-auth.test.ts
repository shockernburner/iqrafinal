import { describe, expect, it, vi } from "vitest";

vi.mock("@workspace/db", () => ({ pool: { query: vi.fn() } }));
vi.mock("../auth.js", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("../logger.js", () => ({ logger: { info: vi.fn() } }));

const { isKbUploadEligible, parseKbUploadAdminEmails } = await import("../kb-upload-auth.js");

describe("isKbUploadEligible", () => {
  it("allows only the two designated uploaders, case-insensitively", () => {
    expect(isKbUploadEligible("firdous.mahmood26@gmail.com")).toBe(true);
    expect(isKbUploadEligible("Reels.javed@gmail.com")).toBe(true);
    expect(isKbUploadEligible("  REELS.JAVED@GMAIL.COM ")).toBe(true);
  });

  it("rejects every other admin and missing emails", () => {
    expect(isKbUploadEligible("someone.else@gmail.com")).toBe(false);
    expect(isKbUploadEligible("firdous.mahmood26@gmail.com.evil.test")).toBe(false);
    expect(isKbUploadEligible("")).toBe(false);
    expect(isKbUploadEligible(null)).toBe(false);
    expect(isKbUploadEligible(undefined)).toBe(false);
  });
});

describe("parseKbUploadAdminEmails", () => {
  it("reads a comma-separated list, normalising case and whitespace", () => {
    expect([...parseKbUploadAdminEmails(" A@Example.com, b@example.com ,c@example.com")]).toEqual([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);
  });

  it("also accepts semicolons, spaces or new lines as separators", () => {
    expect([...parseKbUploadAdminEmails("a@example.com; b@example.com\nc@example.com d@example.com")]).toHaveLength(4);
  });

  it("falls back to the default uploaders when unset, blank, or containing no addresses", () => {
    const defaults = ["firdous.mahmood26@gmail.com", "reels.javed@gmail.com"];
    expect([...parseKbUploadAdminEmails(undefined)]).toEqual(defaults);
    expect([...parseKbUploadAdminEmails("   ")]).toEqual(defaults);
    expect([...parseKbUploadAdminEmails("not-an-email, ,")]).toEqual(defaults);
  });
});
