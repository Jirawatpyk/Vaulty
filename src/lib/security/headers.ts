/**
 * Browser security headers. Live preview is iframed, so we never send
 * X-Frame-Options DENY or CSP frame-ancestors 'none'.
 */
export function contentSecurityPolicy(opts: { dev: boolean }): string {
  const grok = "https://grok.com https://*.grok.com";
  const script = opts.dev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${grok}`
    : `script-src 'self' 'unsafe-inline' blob: ${grok}; script-src-attr 'none'`;
  const connect = opts.dev
    ? `connect-src 'self' ws: wss: https://auth.grok.me https://fonts.googleapis.com https://fonts.gstatic.com ${grok}`
    : `connect-src 'self' https://auth.grok.me ${grok}`;
  const parts = [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    connect,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    "child-src 'none'",
  ];
  if (!opts.dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export function securityHeaders(opts: { dev: boolean }): Record<string, string> {
  return {
    "Content-Security-Policy": contentSecurityPolicy(opts),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "X-DNS-Prefetch-Control": "off",
    "X-Permitted-Cross-Domain-Policies": "none",
  };
}
