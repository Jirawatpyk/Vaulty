import { securityHeaders } from "../../src/lib/security/headers";

interface HeaderEvent {
  req: { headers: Headers };
}

export default async function securityHeadersMiddleware(
  event: HeaderEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  const headers = securityHeaders({ dev: false });
  if (result instanceof Response) {
    const nextHeaders = new Headers(result.headers);
    for (const [key, value] of Object.entries(headers)) {
      if (!nextHeaders.has(key)) nextHeaders.set(key, value);
    }
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: nextHeaders,
    });
  }
  return result;
}
