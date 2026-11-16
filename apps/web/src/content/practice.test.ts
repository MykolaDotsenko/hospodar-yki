import { describe, expect, it } from "vitest";
import { groupLabel, practiceCards } from "./practice.ts";
import { practiceEvidence, practiceReducer, startPractice } from "@hospodar/domain";

describe("practice cards speak the learner's language", () => {
  it("every theme key has a Ukrainian name; only Finnish case terms of rektio stay Finnish", () => {
    for (const c of practiceCards) {
      const label = groupLabel(c.group);
      if (c.kind === "rektio" || c.kind === "form") expect(label, c.id).toMatch(/iivi|aali/);   // Finnish grammar terms stay Finnish
      else expect(label, `${c.id}: ${c.group}`).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);
    }
  });

  it("corpus form cards (CURATED-09): source and adaptation named, the form not visible before the attempt, the answer self-compared and never scored", () => {
    const forms = practiceCards.filter(c => c.kind === "form");
    expect(forms.length).toBeGreaterThanOrEqual(100);                                    // of 120; a card that would leak the form is left out
    for (const c of forms) {
      const source = c.reveal.find(l => l.label_uk === "Джерело")!;
      expect(source.text).toMatch(/UD Finnish FTB.*CC BY 4\.0.*адаптовано/);
      expect(c.reveal.find(l => l.label_uk === "Зверни увагу")!.text).toMatch(/не бал/);
      expect(c.prompt[0]!.text).toContain("___");
      expect(c.choice).toBeUndefined();                                                  // no key to score against
    }
    const card = forms[0]!;
    let s = startPractice(card);
    s = practiceReducer(s, card, { type: "ANSWER", value: "mielen" });
    s = practiceReducer(s, card, { type: "JUDGE", judgement: "partly" });
    s = practiceReducer(s, card, { type: "CONTINUE" });
    s = practiceReducer(s, card, { type: "SUBMIT_TRANSFER", text: "Muutin mieleni." });
    expect(practiceEvidence(s, card).every(e => e.status === "ungraded")).toBe(true);
  });
});
