"use client";

import React, { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, Share2Icon } from "./Icons";
import { likeAction } from "@/lib/actions";
import { useAuth } from "@clerk/nextjs";
import { is } from "zod/v4/locales";
import { set } from "zod";

type PostInteractionProps = {
  postId: string;
  initialLikes: string[];
  commentNumber: number;
};

const PostInteraction = ({
  postId,
  initialLikes,
  commentNumber,
}: PostInteractionProps) => {
  const { userId } = useAuth();

  const [likeState, setLikeState] = useState({
    likeCount: initialLikes.length,
    isLiked: userId ? initialLikes.includes(userId) : false,
  });

  const hadleLikeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLikeState((prev) => ({
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
        isLiked: !prev.isLiked,
      }));
      await likeAction(postId);
    } catch (err) {
      setLikeState((prev) => ({
        likeCount: prev.isLiked ? prev.likeCount + 1 : prev.likeCount - 1,
        isLiked: !prev.isLiked,
      }));
    }
  };

  return (
    <div className="flex items-center">
      <form onSubmit={hadleLikeSubmit}>
        <input type="hidden" name="postId" value={postId} />
        <Button variant="ghost" size="icon" type="submit">
          <HeartIcon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </form>
      <span className="-ml-1">{likeState.likeCount}</span>

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
