import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ClockIcon } from "./Icons";
import PostInteraction from "./PostInteraction";

const Post = ({ post }: any) => {
  return (
    <div
      key={post.id}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.author.image ?? "/placeholder-user.jpg"} />
          <AvatarFallback>
            {(post.author.name ?? "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-bold">{post.author.name ?? "No Name"}</h3>
          <p className="text-muted-foreground">
            {post.author.username ? `@${post.author.username}` : ""}
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
          />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ClockIcon className="h-5 w-5" />
          <span>{new Date(post.createdAt).toLocaleString("ja-JP")}</span>
        </div>
      </div>

      {/* 返信件数 */}
      {post._count?.replies ? (
        <div className="mt-2 text-sm text-muted-foreground">
          返信 {post._count.replies} 件
        </div>
      ) : null}
    </div>
  );
};

export default Post;
