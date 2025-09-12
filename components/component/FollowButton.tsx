// components/component/FollowButton.tsx
"use client";

import React, { useOptimistic } from "react";
import { Button } from "../ui/button";

interface FollowButtonProps {
  isCurrentUser: boolean;
  isFollowing: boolean;
  // page.tsx から渡す Server Action
  toggleFollowAction?: (formData: FormData) => Promise<void>;
}

const FollowButton = ({
  isCurrentUser,
  isFollowing,
  toggleFollowAction,
}: FollowButtonProps) => {
  const [optimistic, addOptimistic] = useOptimistic<
    { isFollowing: boolean },
    boolean
  >(
    { isFollowing },
    (_state, next) => ({ isFollowing: next }) // ← action を使って上書き
  );
  const getButtonContent = () => {
    if (isCurrentUser) return "プロフィール編集";
    return optimistic.isFollowing ? "フォロー中" : "フォローする";
  };

  const getButtonVariant = () => {
    if (isCurrentUser) return "secondary";
    return optimistic.isFollowing ? "outline" : "default";
  };

  return (
    <form
      action={async (fd) => {
        if (isCurrentUser || !toggleFollowAction) return;
        addOptimistic(!optimistic.isFollowing); // 楽観更新
        await toggleFollowAction(fd); // サーバーアクション実行
      }}
    >
      <Button
        type="submit"
        variant={getButtonVariant()}
        className="w-full"
        // 自分のプロフィールは押せない（編集画面に飛ばすなら onClick で遷移に切替）
        disabled={isCurrentUser}
      >
        {getButtonContent()}
      </Button>
    </form>
  );
};

export default FollowButton;
