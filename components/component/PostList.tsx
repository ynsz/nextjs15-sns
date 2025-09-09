// components/PostList.tsx
import { unstable_noStore as noStore } from "next/cache";
import { fetchMyPosts } from "@/lib/postDataFetcher";
import Post from "./Post";

export default async function PostList() {
  noStore(); // 投稿直後も反映

  const posts = await fetchMyPosts();

  return (
    <div className="space-y-4">
      {posts.length ? (
        posts.map((post) => <Post key={post.id} post={post} />)
      ) : (
        <div>ポストが見つかりません。</div>
      )}
    </div>
  );
}
