// app/api/_debug-prisma/route.ts
export const runtime = "nodejs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.user.count();
    return new Response(`User count: ${count}`, { status: 200 });
  } catch (e) {
    console.error("DB error:", e);
    return new Response("DB NG", { status: 500 });
  }
}
