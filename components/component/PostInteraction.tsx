"use client";

import React, { useOptimistic } from "react";
import { likeAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, Share2Icon } from "./Icons";

interface LikeState {
  likeCount: number;
  isLiked: boolean;
}

type PostInteractionProps = {
  postId: string;
  initialLikes: string[];
  commentNumber: number;
  meId: string | null;
};

const PostInteraction = ({
  postId,
  initialLikes,
  commentNumber,
  meId,
}: PostInteractionProps) => {
  const initialState: LikeState = {
    likeCount: initialLikes.length,
    isLiked: meId ? initialLikes.includes(meId) : false,
  };

  const [optimisticLike, addOptimisticLike] = useOptimistic<LikeState, void>(
    initialState,
    (current) => ({
      likeCount: current.isLiked
        ? current.likeCount - 1
        : current.likeCount + 1,
      isLiked: !current.isLiked,
    })
  );

  const handleLikeSubmit = async () => {
    try {
      addOptimisticLike(); // 先にUIだけ更新
      await likeAction(postId); // サーバー処理
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex items-center">
      <form action={handleLikeSubmit}>
        <input type="hidden" name="postId" value={postId} />
        <Button variant="ghost" size="icon" type="submit">
          <HeartIcon
            className={`h-5 w-5 ${
              optimisticLike.isLiked
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          />
        </Button>
      </form>

      <span
        className={`-ml-1 ${optimisticLike.isLiked ? "text-destructive" : ""}`}
      >
        {optimisticLike.likeCount}
      </span>

      <Button variant="ghost" size="icon">
        <MessageCircleIcon className="h-5 w-5 text-muted-foreground" />
      </Button>
      <span className="-ml-1">{commentNumber}</span>

      <Button variant="ghost" size="icon">
        <Share2Icon className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
};

export default PostInteraction;
