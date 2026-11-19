import { describe, expect, it } from "vitest";
import { KEYBOARD_SAMPLE_FI, keyboardCheck } from "../src/index.ts";

describe("keyboard check before a rehearsal (digital-task-literacy)", () => {
  it("says only what the keyboard did: exact sample, Ukrainian layout, missing ä/ö, or another difference", () => {
    expect(keyboardCheck(KEYBOARD_SAMPLE_FI).verdict).toBe("ok");
    expect(keyboardCheck("  Hyvää   päivää, söin jäätelöä. ").verdict).toBe("ok");                       // spacing is not the keyboard
    expect(keyboardCheck("Hyvää päivää, söin jäätelöä.").verdict).toBe("ok");   // combining ¨ = ä
    expect(keyboardCheck("Hyvaa paivaa, soin jaateloa.").verdict).toBe("umlauts");
    expect(keyboardCheck("Hyvää paivaa, söin jaateloa.").verdict).toBe("umlauts");                         // some came out, some not
    const cyr = keyboardCheck("Hyvää päivää, söin jäätelöа.");                                             // the last «а» is Cyrillic
    expect(cyr.verdict).toBe("cyrillic");
    expect(cyr.cyrillicChars).toEqual(["а"]);
    expect(keyboardCheck("Hyvää päivää, söin jäätelöä").verdict).toBe("different");                      // a missing dot is a typo, not the keyboard
    expect(keyboardCheck("").verdict).toBe("different");
  });
});
