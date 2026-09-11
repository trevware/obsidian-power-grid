import { DEFAULT_STAGE, isStage } from "./density";
import type { DensityStage } from "./density";
import type { OrikoSettings } from "./settings";

/**
 * A grid's look: the five settings that decide what one wall looks like,
 * and whether every wall answers them the same way.
 *
 * Which is the choice `gridLookScope` makes. On "all" there is one answer
 * for the vault, which is what every install had before this existed. On
 * "grid" each wall keeps its own, and anything it has not been given falls
 * back to the shared setting the settings tab edits.
 *
 * A grid holds an override, never a copy. That is what lets a grid you have
 * never touched look right the moment the switch goes on, lets a change to
 * a shared value still move every grid that has not overridden it, and lets
 * the switch go back to "all" without losing what a grid was given: its
 * values sit there unread until the switch returns.
 *
 * Design: docs/superpowers/specs/2026-09-11-per-grid-look-design.md.
 */

export type LookScope = "all" | "grid";

/**
 * What one grid says for itself. Every key optional, an absent one reading
 * the shared setting, which is what makes this an override rather than a
 * copy. Tile size is not here: it is stored apart, because it is the one of
 * the five that does not travel to your other devices. See resolveLook.
 */
export interface GridLook {
  tileDate?: string;
  tileProperty?: string;
  filterProperties?: string[];
  autoplayVideo?: boolean;
}

/** The five values in force on a wall, with nothing left to decide. */
export interface ResolvedLook {
  tileSize: DensityStage;
  tileDate: string;
  tileProperty: string;
  filterProperties: string[];
  autoplayVideo: boolean;
}

/**
 * The five values a wall should be drawn with.
 *
 * The two overrides arrive separately because they are stored separately: a
 * grid's `look` rides on the grid and syncs with it, while its tile size is
 * device-local, a stage being a target column width in pixels and a phone
 * wanting a different one from a desktop. Passing undefined for both is the
 * "all" case, so the scope is read once by the caller and never in here.
 *
 * Every fallback is `??` and not `||`, because `false` and `""` are both
 * real answers: autoplay off, and a tile corner left empty.
 */
export function resolveLook(
  settings: OrikoSettings,
  look: GridLook | undefined,
  tileSize: DensityStage | undefined
): ResolvedLook {
  return {
    // A stage the wall does not know degrades to the shared one, so a hand
    // edit or a stale value cannot leave the wall with no width to lay out
    // to. columnWidthFor makes the same bargain one level down.
    tileSize: isStage(tileSize) ? tileSize : sharedStage(settings),
    tileDate: look?.tileDate ?? settings.tileDate,
    tileProperty: look?.tileProperty ?? settings.tileProperty,
    // Copied, so a caller sorting or pushing cannot write into the stored
    // list. The filter menu builds from this on every open.
    filterProperties: [...(look?.filterProperties ?? settings.filterProperties)],
    autoplayVideo: look?.autoplayVideo ?? settings.autoplayVideo,
  };
}

function sharedStage(settings: OrikoSettings): DensityStage {
  return isStage(settings.tileSize) ? settings.tileSize : DEFAULT_STAGE;
}
