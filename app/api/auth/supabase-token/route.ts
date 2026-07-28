import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { SignJWT } from "jose";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
  const supabaseToken = await new SignJWT({
    sub: session.user.id,
    "role": "authenticated",
    "email": session.user.email,
  })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret)
  return NextResponse.json({ token: supabaseToken }, { headers: { "Cache-Control": "private, max-age=2700, stale-while-revalidate=300" } });
}