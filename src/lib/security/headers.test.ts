import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSecurityPolicy, securityHeaders } from "./headers.ts";

describe("CSP", () => {
  it("is fail-closed: self default, no objects, no child frames of arbitrary origins", () => {
    const prod = contentSecurityPolicy({ dev: false });
    assert.match(prod, /default-src 'self'/);
    assert.match(prod, /object-src 'none'/);
    assert.match(prod, /base-uri 'self'/);
    assert.match(prod, /form-action 'self'/);
    assert.match(prod, /script-src-attr 'none'/);
    assert.doesNotMatch(prod, /unsafe-eval/);
    assert.doesNotMatch(prod, /default-src \*/);
    assert.doesNotMatch(prod, /frame-ancestors 'none'/);
  });

  it("lets Vite HMR eval in development only", () => {
    const dev = contentSecurityPolicy({ dev: true });
    assert.match(dev, /unsafe-eval/);
    assert.doesNotMatch(dev, /upgrade-insecure-requests/);
  });

  it("sets nosniff and a tight permissions policy", () => {
    const headers = securityHeaders({ dev: false });
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.match(headers["Permissions-Policy"], /camera=\(\)/);
    assert.match(headers["Permissions-Policy"], /payment=\(\)/);
    assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin-allow-popups");
  });
});
