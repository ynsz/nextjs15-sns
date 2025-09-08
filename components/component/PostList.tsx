// components/PostList.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, Share2Icon, ClockIcon } from "./Icons";
import { unstable_noStore as noStore } from "next/cache";
import { fetchMyPosts } from "@/lib/postDataFetcher";

export default async function PostList() {
  noStore(); // 投稿直後も反映

  const posts = await fetchMyPosts();

  if (!posts.length) {
    return (
      <div className="text-sm text-muted-foreground">まだ投稿がありません</div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
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
              <h3 className="text-lg font-bold">
                {post.author.name ?? "No Name"}
              </h3>
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
              <Button variant="ghost" size="icon">
                <HeartIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircleIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2Icon className="h-5 w-5 text-muted-foreground" />
              </Button>
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
      ))}
    </div>
  );
}
