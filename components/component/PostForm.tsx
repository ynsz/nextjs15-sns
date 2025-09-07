"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendIcon } from "./Icons";
import { useRef, useState } from "react";
import { addPostAction, type AddPostResult } from "@/lib/actions";

export default function PostForm() {
  const [error, setError] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const result: AddPostResult = await addPostAction(formData);

    if (!result.success) {
      setError(result.error); // ← ここで表示用の state に格納
      return; // Promise<void> を満たす
    }

    // 成功時
    setError("");
    formRef.current?.reset();
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>

        <form
          ref={formRef}
          action={handleSubmit}
          className="flex flex-1 items-center"
        >
          <Input
            type="text"
            name="post"
            placeholder="What's on your mind?"
            className="flex-1 rounded-full bg-muted px-4 py-2"
            maxLength={140}
          />
          <Button variant="ghost" size="icon" type="submit">
            <SendIcon className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Tweet</span>
          </Button>
        </form>
      </div>
      {/* ここにバリデーションメッセージが出る */}
      {error && <p className="text-destructive mt-2 ml-14">{error}</p>}
    </div>
  );
}
