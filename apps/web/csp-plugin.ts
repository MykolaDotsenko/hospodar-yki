import type { Plugin } from "vite";

/**
 * Content-Security-Policy for the BUILT app only (static hosting such as GitHub Pages cannot send headers, so it is a
 * <meta>). The dev server injects inline scripts for HMR, so the policy is not applied there.
 *
 * The app is local-first: everything it loads comes from its own origin; recordings and their playback use blob: URLs;
 * no third-party scripts, fonts, frames, analytics or network APIs. YouTube/OPH sources are plain links (navigation),
 * which CSP does not restrict. `frame-ancestors` cannot be set from <meta>; it needs a host that sends headers.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export function cspPlugin(): Plugin {
  return {
    name: "hospodar-csp",
    apply: "build",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY }, injectTo: "head-prepend" },
      { tag: "meta", attrs: { name: "referrer", content: "no-referrer" }, injectTo: "head-prepend" },
    ],
  };
}
