import { describe, expect, it } from "vitest";
import { groupLabel, practiceCards } from "./practice.ts";

describe("practice cards speak the learner's language", () => {
  it("every theme key has a Ukrainian name; only Finnish case terms of rektio stay Finnish", () => {
    for (const c of practiceCards) {
      const label = groupLabel(c.group);
      if (c.kind === "rektio") expect(label, c.id).toMatch(/iivi/);
      else expect(label, `${c.id}: ${c.group}`).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);
    }
  });
});
