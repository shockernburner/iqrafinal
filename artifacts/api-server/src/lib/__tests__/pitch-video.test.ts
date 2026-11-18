import { describe, expect, it } from "vitest";
import { parseVideoLink, PitchVideoError } from "../pitch-video.js";

describe("parseVideoLink", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL1", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("reads the YouTube id from %s", (link, id) => {
    expect(parseVideoLink(link)).toEqual({ provider: "youtube", id });
  });

  it("reads Vimeo ids, including unlisted privacy hashes", () => {
    expect(parseVideoLink("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", id: "76979871", hash: null });
    expect(parseVideoLink("https://vimeo.com/76979871/a1b2c3d4e5")).toEqual({ provider: "vimeo", id: "76979871", hash: "a1b2c3d4e5" });
    expect(parseVideoLink("https://player.vimeo.com/video/76979871?h=a1b2c3")).toEqual({ provider: "vimeo", id: "76979871", hash: "a1b2c3" });
    expect(parseVideoLink("https://vimeo.com/channels/staffpicks/76979871")).toEqual({ provider: "vimeo", id: "76979871", hash: null });
  });

  it("accepts direct https video files", () => {
    expect(parseVideoLink("https://cdn.example.com/pitch/founder.mp4")).toEqual({
      provider: "file",
      url: "https://cdn.example.com/pitch/founder.mp4",
    });
    expect(parseVideoLink("https://cdn.example.com/a.webm?v=2")).toMatchObject({ provider: "file" });
  });

  it.each([
    "",
    "   ",
    "not a link at all",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/@somechannel",
    "https://vimeo.com/about",
    "http://cdn.example.com/founder.mp4",
    "https://example.com/page.html",
    "javascript:alert(1)",
    "https://drive.google.com/file/d/abc/view",
  ])("rejects %j with a friendly error", (link) => {
    expect(() => parseVideoLink(link)).toThrow(PitchVideoError);
  });
});
