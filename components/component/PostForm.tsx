"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useFormState } from "react-dom";
import SubmitButton from "./SubmitButton";
import { addPostAction, type AddPostResult } from "@/lib/actions";
import { useRef } from "react";

const initialState: AddPostResult = { success: false, error: "" };

export default function PostForm() {
  // useFormState は (prevState, formData) => State の関数を受け取る
  const [state, formAction] = useFormState(addPostAction, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  if (state.success && formRef.current) {
    // 投稿成功したらテキストをクリアする
    formRef.current.reset();
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>

        {/* Server Action を直接 action に渡す */}
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-1 items-center"
        >
          <Input
            type="text"
            name="post"
            placeholder="What's on your mind?"
            className="flex-1 rounded-full bg-muted px-4 py-2"
            maxLength={140}
          />
          <SubmitButton />
        </form>
      </div>
      {/* バリデーションや保存エラーをここに表示 */}
      {!state.success && state.error && (
        <p className="text-destructive mt-2 ml-14">{state.error}</p>
      )}
    </div>
  );
}
