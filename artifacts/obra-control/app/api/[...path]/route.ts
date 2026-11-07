import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(request: NextRequest): Promise<Response> {
  const target = process.env.API_TARGET ?? "http://127.0.0.1:8080";
  const upstreamUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, target);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", request.headers.get("host") ?? request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("x-powered-by");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "El servicio de la aplicación no está disponible" }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
