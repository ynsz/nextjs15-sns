export const runtime = "nodejs";
import prisma from "@/lib/prisma";
export async function GET() {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return Response.json(rows);
}
