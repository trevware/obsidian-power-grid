import { describe, expect, it } from "vitest";
import { MAX_PENDING_TRIES, PendingSources } from "../src/core/pending";

describe("PendingSources", () => {
  it("waits for a source the vault has not caught up with", () => {
    const pending = new PendingSources();
    expect(pending.wait("a.md", "sig")).toBe(true);
  });

  it("gives up once it has waited long enough that the file is not coming", () => {
    const pending = new PendingSources();
    for (let i = 0; i < MAX_PENDING_TRIES; i++) {
      expect(pending.wait("a.md", "sig")).toBe(true);
    }
    expect(pending.wait("a.md", "sig")).toBe(false);
  });

  it("counts each clipping separately", () => {
    const pending = new PendingSources();
    for (let i = 0; i < MAX_PENDING_TRIES; i++) pending.wait("a.md", "sig");
    expect(pending.wait("b.md", "sig")).toBe(true);
  });

  it("starts over when the cover changes", () => {
    // Archiving swapping a remote cover for a local one is a different file
    // to wait on, so it gets the full patience of a new one.
    const pending = new PendingSources();
    for (let i = 0; i < MAX_PENDING_TRIES; i++) pending.wait("a.md", "sig");
    expect(pending.wait("a.md", "other")).toBe(true);
  });
});
