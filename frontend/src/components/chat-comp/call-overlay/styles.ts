import type { CSSProperties } from "react";

/* ─── Shared constants ───────────────────────────────────────────── */

/** Dark blurred backdrop shared by the ringing and in-call screens. */
export const BACKDROP_STYLE: CSSProperties = {
  background: "linear-gradient(135deg, rgba(15,10,30,0.96) 0%, rgba(30,15,50,0.96) 50%, rgba(15,10,30,0.96) 100%)",
  backdropFilter: "blur(24px)",
};
