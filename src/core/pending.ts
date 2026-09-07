/**
 * Covers whose file the vault cannot resolve yet.
 *
 * `resourceUrl` returns "" for a path the vault holds no file for, and that
 * is the ordinary state of an attachment written a moment ago: the bytes are
 * on disk but the file registry has not caught up. The wall used to mount
 * that empty string as a source, which fires `error` in Chromium, and the
 * tile was then recorded as a broken cover and dropped for the rest of the
 * session — over a race the very next paint would have won. So an empty
 * source is a wait, not a failure, and this counts how long the wall has been
 * waiting so that a file which genuinely is not coming still stops asking.
 */

/** Gap between attempts. Long enough to be worth the wait, short enough that
    a clipping does not visibly lag the progress bar that announced it. */
export const PENDING_RETRY_MS = 200;

/** Attempts before a missing file is treated as missing for good, rather
    than repainting the wall every fifth of a second forever. */
export const MAX_PENDING_TRIES = 10;

export class PendingSources {
  /** Note path → the cover waited on, and how many times. */
  private waits = new Map<string, { signature: string; tries: number }>();

  /**
   * Records an attempt and says whether the wall should paint again.
   *
   * False once the patience for this cover is spent, which is the caller's
   * cue to treat it as unloadable and drop the tile.
   */
  wait(id: string, signature: string): boolean {
    const seen = this.waits.get(id);
    // A different cover is a different file to wait on: archiving swapping a
    // remote copy for a local one has nothing to do with the last one's luck.
    const tries = seen && seen.signature === signature ? seen.tries : 0;
    if (tries >= MAX_PENDING_TRIES) return false;
    this.waits.set(id, { signature, tries: tries + 1 });
    return true;
  }
}
