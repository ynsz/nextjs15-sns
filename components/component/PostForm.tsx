// components/PostForm.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendIcon } from "./Icons";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ① 関数の外に出す & trim を入れる
const PostTextSchema = z
  .string()
  .trim()
  .min(1, "ポスト内容を入力してください")
  .max(140, "ポスト内容は140文字以内で入力してください");

export default function PostForm() {
  async function addPostAction(formData: FormData) {
    "use server";

    const { userId } = auth();
    if (!userId) throw new Error("Not signed in");

    // ② safeParse を使う
    const parsed = PostTextSchema.safeParse(formData.get("post"));
    if (!parsed.success) {
      // ここで UI に返したいなら、useFormState等と組み合わせて {error: "..."} を返す
      // いまは単純に終了
      console.error(parsed.error.flatten().formErrors);
      return;
    }
    const text = parsed.data; // ③ 検証済みの値を使う

    // Clerk の userId → アプリDBの User.id に変換
    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (!me) throw new Error("User row not found");

    // フィールド名は schema.prisma に合わせて（content or text）
    await prisma.post.create({
      data: {
        content: text,
        authorId: me.id,
      },
    });

    revalidatePath("/");
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-10 h-10">
        <AvatarImage src="/placeholder-user.jpg" />
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>

      <form action={addPostAction} className="flex items-center flex-1">
        <Input
          type="text"
          placeholder="What's on your mind?"
          className="flex-1 rounded-full bg-muted px-4 py-2"
          name="post"
        />
        <Button variant="ghost" size="icon" type="submit">
          <SendIcon className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Tweet</span>
        </Button>
      </form>
    </div>
  );
}
