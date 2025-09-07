// lib/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "./prisma";

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

    await new Promise((resolve) => setTimeout(resolve, 3000)); // デバッグ用に3秒待つ

    // Clerk の userId → DB の User.id（cuid）を引く（FK対策）
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!dbUser) return { success: false, error: "ユーザーが見つかりません。" };

    await prisma.post.create({
      data: { content: parsed.data, authorId: dbUser.id },
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "保存に失敗しました。",
    };
  }
}
