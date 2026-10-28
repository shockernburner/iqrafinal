import { describe, expect, it, vi } from "vitest";

vi.mock("@workspace/db", () => ({ pool: { query: vi.fn() } }));
vi.mock("../auth.js", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));

const { isKbUploadEligible } = await import("../kb-upload-auth.js");

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
