// components/PostList.tsx
import { unstable_noStore as noStore } from "next/cache";
import { fetchTimelinePosts } from "@/lib/postDataFetcher";
import Post from "./Post";

export default async function PostList({ username }: { username: string }) {
  noStore(); // 投稿直後も反映

  const posts = await fetchTimelinePosts(username);

  return (
    <div className="space-y-4">
      {posts ? (
        posts.map((post) => <Post key={post.id} post={post} />)
      ) : (
        <div>ポストが見つかりません。</div>
      )}
    </div>
  );
}
