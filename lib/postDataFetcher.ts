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

/** タイムライン用：自分＋フォロー中ユーザーの投稿（未ログイン時は空配列） */
export async function fetchTimelinePosts(): Promise<PostItem[]> {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return [];

  // 1) ClerkのID → アプリのUser.id（cuid）に解決
  const me = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!me) return [];

  // 2) Followは「アプリのUser.id」を見る
  const following = await prisma.follow.findMany({
    where: { followerId: me.id }, // ← ここを clerkUserId ではなく me.id に
    select: { followingId: true },
  });

  // 自分の投稿も含めたいので me.id を先頭に
  const authorIds = [me.id, ...following.map((f) => f.followingId)];

  // 3) 自分 + フォロー中ユーザーの投稿を新しい順で取得
  return prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    include: {
      author: { select: { name: true, username: true, image: true } },
      likes: { select: { userId: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
