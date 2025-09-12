// lib/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

export type AddPostResult =
  | { success: true; error?: undefined }
  | { success: false; error: string };

// useFormState に渡すため、(prevState, formData) シグネチャにする
export async function addPostAction(
  _prevState: AddPostResult,
  formData: FormData
): Promise<AddPostResult> {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: "ログインしてください。" };

    const raw = formData.get("post");
    const postText = typeof raw === "string" ? raw.trim() : "";

    const schema = z
      .string()
      .min(1, "ポスト内容を入力してください。")
      .max(140, "140文字以内で入力してください。");

    const parsed = schema.safeParse(postText);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // デバッグ用に3秒待つ

    // Clerk の userId → DB の User.id（cuid）を引く（FK対策）
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) return { success: false, error: "ユーザーが見つかりません。" };

    await prisma.post.create({
      data: { content: parsed.data, authorId: dbUser.id },
    });

    revalidatePath("/");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "保存に失敗しました。",
    };
  }
}

export async function likeAction(postId: string) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) throw new Error("Not signed in");

  // Clerk の userId → DB の User.id に変換
  const me = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!me) throw new Error("User not found in DB");

  const existingLikes = await prisma.like.findFirst({
    where: { postId, userId: me.id },
  });

  if (existingLikes) {
    await prisma.like.delete({ where: { id: existingLikes.id } });
  } else {
    await prisma.like.create({
      data: { postId, userId: me.id },
    });
  }

  revalidatePath("/");
}

export const followAction = async (targetUserId: string) => {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) throw new Error("Not signed in");

  // Clerk → DB の自分のIDに解決
  const me = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, username: true },
  });
  if (!me) throw new Error("User not found in DB");

  if (me.id === targetUserId) {
    throw new Error("自分自身はフォローできません。");
  }

  // 対象ユーザー（usernameをrevalidateで使う）
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, username: true },
  });
  if (!target) throw new Error("Target user not found");

  // 既存フォロー有無（※ すべて DBのUser.id で判定）
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: me.id,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    // アンフォロー
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: me.id,
          followingId: target.id,
        },
      },
    });
  } else {
    // フォロー
    await prisma.follow.create({
      data: {
        followerId: me.id,
        followingId: target.id,
      },
    });
  }

  // プロフィールは username でルーティングしている想定
  if (target.username) revalidatePath(`/profile/${target.username}`);
  if (me.username) revalidatePath(`/profile/${me.username}`);
  // タイムラインも更新したいなら
  revalidatePath("/");
};
