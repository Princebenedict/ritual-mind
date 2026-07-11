import {NextResponse} from "next/server";

/**
 * Same origin proxy to the official Ritual RPC. The browser posts standard JSON-RPC here
 * and this route forwards it to https://rpc.ritualfoundation.org. This avoids browser CORS
 * restrictions and keeps the RPC endpoint configurable server side. No data is invented or
 * cached. The response is passed through unchanged.
 */
const RPC_URL =
  process.env.RITUAL_RPC_URL ??
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.NEXT_PUBLIC_RITUAL_RPC_URL ??
  "https://rpc.ritualfoundation.org";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  try {
    const upstream = await fetch(RPC_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body,
      cache: "no-store",
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {"Content-Type": "application/json"},
    });
  } catch {
    return NextResponse.json({error: {message: "Ritual RPC is unreachable"}}, {status: 502});
  }
}
