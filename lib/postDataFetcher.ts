// lib/postDataFetcher.ts
import "server-only";
import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import type { Prisma } from "@prisma/client";

export type PostItem = Prisma.PostGetPayload<{
  include: {
    author: { select: { name: true; username: true; image: true } };
    likes: { select: { userId: true } };
    _count: { select: { replies: true } };
  };
}>;

/** ログイン中ユーザーの投稿を取得（未ログイン時は空配列） */
export async function fetchMyPosts(): Promise<PostItem[]> {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return [];

  const me = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!me) return [];

  return prisma.post.findMany({
    where: { authorId: me.id },
    include: {
      author: { select: { name: true, username: true, image: true } },
      likes: { select: { userId: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
