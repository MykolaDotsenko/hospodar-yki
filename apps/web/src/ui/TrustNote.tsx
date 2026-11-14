import type { ReactNode } from "react";
import { IN_RELEASE } from "../content/release.ts";

/** The one place for content-status disclaimers (front-end plan point 8; AC-25 same identity on every
 *  screen; COG focus budget). Same wording, look and position everywhere: at most one per screen state,
 *  right under the route. Honest status, never hidden — but said once, not scattered. Never in EXAM. */
export function TrustNote({ many, children }: { many?: boolean; children?: ReactNode }) {
  // A release build shows only S2-published items, so "draft" would be false there; the rest of the note
  // (e.g. "no automatic grading", "not a CEFR level") stays true and is kept.
  if (IN_RELEASE) return children ? <p className="muted" data-trust-note="release">{children}</p> : null;
  return (
    <p className="draft-note" data-trust-note>
      {many ? "Чернетки" : "Чернетка"}: ще не перевірено S2-викладачем.{children ? <> {children}</> : null}
    </p>
  );
}
