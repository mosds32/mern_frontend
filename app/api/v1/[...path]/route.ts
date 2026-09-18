import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://mern-back-eta.vercel.app/api/v1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const headers = new Headers(request.headers);
  const accessToken = headers.get("x-access-token");

  headers.delete("host");
  headers.delete("x-access-token");
  headers.delete("content-length");

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  const response = await fetch(`${API_BASE}/${path.join("/")}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
