import { describe, expect, it } from "vitest";
import { detectLogoMime } from "../corporate-sponsors.js";

describe("detectLogoMime", () => {
  it("recognises PNG, JPEG and WebP by their magic bytes", () => {
    expect(detectLogoMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))).toBe("image/png");
    expect(detectLogoMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectLogoMime(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]))).toBe("image/webp");
  });

  it("rejects SVG and other content regardless of the file name or declared type", () => {
    expect(detectLogoMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'))).toBeNull();
    expect(detectLogoMime(Buffer.from("GIF89a"))).toBeNull();
    expect(detectLogoMime(Buffer.alloc(0))).toBeNull();
  });
});
