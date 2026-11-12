import type { ReactNode } from "react";

/** The one place for content-status disclaimers (front-end plan point 8; AC-25 same identity on every
 *  screen; COG focus budget). Same wording, look and position everywhere: at most one per screen state,
 *  right under the route. Honest status, never hidden — but said once, not scattered. Never in EXAM. */
export function TrustNote({ many, children }: { many?: boolean; children?: ReactNode }) {
  return (
    <p className="draft-note" data-trust-note>
      {many ? "Чернетки" : "Чернетка"}: ще не перевірено S2-викладачем.{children ? <> {children}</> : null}
    </p>
  );
}
