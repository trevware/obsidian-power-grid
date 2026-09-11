import { describe, expect, it } from "vitest";
import { resolveLook } from "../src/core/look";
import type { GridLook } from "../src/core/look";
import { DEFAULT_SETTINGS } from "../src/core/settings";
import type { OrikoSettings } from "../src/core/settings";

const shared: OrikoSettings = {
  ...DEFAULT_SETTINGS,
  tileSize: "m",
  tileDate: "created",
  tileProperty: "categories",
  filterProperties: ["categories", "status"],
  autoplayVideo: true,
};

describe("resolveLook", () => {
  it("falls back to the shared setting for everything with no override", () => {
    expect(resolveLook(shared, undefined, undefined)).toEqual({
      tileSize: "m",
      tileDate: "created",
      tileProperty: "categories",
      filterProperties: ["categories", "status"],
      autoplayVideo: true,
    });
  });

  it("takes each value the grid has set", () => {
    const look: GridLook = {
      tileDate: "published",
      tileProperty: "author",
      filterProperties: ["series"],
      autoplayVideo: false,
    };
    expect(resolveLook(shared, look, "l")).toEqual({
      tileSize: "l",
      tileDate: "published",
      tileProperty: "author",
      filterProperties: ["series"],
      autoplayVideo: false,
    });
  });

  it("mixes an override with the shared settings it says nothing about", () => {
    const resolved = resolveLook(shared, { tileDate: "published" }, undefined);
    expect(resolved.tileDate).toBe("published");
    expect(resolved.tileProperty).toBe("categories");
    expect(resolved.tileSize).toBe("m");
    expect(resolved.autoplayVideo).toBe(true);
  });

  it("keeps an override of false, which is a value and not an absence", () => {
    expect(resolveLook(shared, { autoplayVideo: false }, undefined).autoplayVideo).toBe(false);
  });

  it("keeps an override of \"\", which is how a corner is emptied", () => {
    const resolved = resolveLook(shared, { tileDate: "", tileProperty: "" }, undefined);
    expect(resolved.tileDate).toBe("");
    expect(resolved.tileProperty).toBe("");
  });

  it("keeps an override of no filter properties at all", () => {
    expect(resolveLook(shared, { filterProperties: [] }, undefined).filterProperties).toEqual([]);
  });

  it("degrades an unknown stage to the shared one, so a hand edit cannot break the wall", () => {
    expect(resolveLook(shared, undefined, "enormous" as never).tileSize).toBe("m");
  });

  it("hands back copies, so a caller cannot write into the stored arrays", () => {
    const resolved = resolveLook(shared, undefined, undefined);
    resolved.filterProperties.push("author");
    expect(shared.filterProperties).toEqual(["categories", "status"]);

    const look: GridLook = { filterProperties: ["series"] };
    resolveLook(shared, look, undefined).filterProperties.push("author");
    expect(look.filterProperties).toEqual(["series"]);
  });
});
