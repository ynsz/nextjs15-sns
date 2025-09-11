import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ClockIcon } from "./Icons";
import PostInteraction from "./PostInteraction";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";

const Post = async ({ post }: any) => {
  const { userId: clerkUserId } = auth();
  const me = clerkUserId
    ? await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      })
    : null;

  const username = post.author?.username;
  const profileHref = username
    ? `/profile/${encodeURIComponent(username)}`
    : undefined;

  return (
    <div
      key={post.id}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
    >
      <div className="flex items-center gap-4 mb-4">
        {profileHref ? (
          <Link href={profileHref}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.image ?? "/placeholder-user.jpg"} />
              <AvatarFallback>
                {(post.author.name ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.image ?? "/placeholder-user.jpg"} />
            <AvatarFallback>
              {(post.author.name ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div>
          <h3 className="text-lg font-bold">{post.author.name ?? "No Name"}</h3>
          <p className="text-muted-foreground">
            {username ? `@${username}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p>{post.content}</p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <PostInteraction
            postId={post.id}
            initialLikes={post.likes.map((like: any) => like.userId)}
            commentNumber={post._count.replies}
            meId={me?.id ?? null}
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ClockIcon className="h-5 w-5" />
          <span>{new Date(post.createdAt).toLocaleString("ja-JP")}</span>
        </div>
      </div>

      {post._count?.replies ? (
        <div className="mt-2 text-sm text-muted-foreground">
          返信 {post._count.replies} 件
        </div>
      ) : null}
    </div>
  );
};

export default Post;
