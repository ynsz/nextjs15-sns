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

/** タイムライン用：
 *  - ホーム：自分＋フォロー中ユーザーの投稿
 *  - プロフィール：指定 username のユーザーの投稿のみ
 *  - 未ログイン時は空配列
 */
export async function fetchTimelinePosts(
  username?: string
): Promise<PostItem[]> {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) return [];

  // Clerk のID → アプリの User.id
  const me = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!me) return [];

  // --- プロフィールタイムライン（そのユーザーの投稿だけ） ---
  if (username) {
    const profileUser = await prisma.user.findUnique({
      where: { username }, // username はユニーク想定
      select: { id: true },
    });
    if (!profileUser) return [];

    return prisma.post.findMany({
      where: { authorId: profileUser.id },
      include: {
        author: { select: { name: true, username: true, image: true } },
        likes: { select: { userId: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // --- ホームタイムライン（自分＋フォロー中） ---
  const following = await prisma.follow.findMany({
    where: { followerId: me.id }, // 自分がフォローしている先
    select: { followingId: true },
  });

  // 自分の投稿も含める
  const authorIds = [me.id, ...following.map((f) => f.followingId)];

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
