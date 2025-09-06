// Clerk：家（アプリ）に荷物を届けてくれる配達員
// Webhook：配達（イベント通知）
// Svix 署名チェック：配達員の身分証を確認（なりすまし防止）
// Prisma：家の中の「住民台帳（DB）」に新しい人を登録する係
// Route Handler (app/api/webhooks/route.ts)：玄関で荷物（通知）を受け取る人

// 1.「ここは Node.js で動かしてね」宣言（Prisma は Edge で使えないから）
export const runtime = "nodejs"; // Prisma を使うので Edge ではなく Node.js

import { Webhook } from "svix"; // svix：署名検証ツール
import { headers } from "next/headers"; // headers()：届いた手紙の封筒（ヘッダー）を読む
import type { NextRequest } from "next/server"; // NextRequest：届いた手紙（リクエスト）
import prisma from "@/lib/prisma"; // prisma：DB係

// 玄関で「POST で届いた荷物」を受け取る関数。
export async function POST(req: NextRequest) {
  // 2.身分証（署名）チェックのための準備（秘密の合言葉 CLERK_WEBHOOK_SECRET とヘッダー）
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET)
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  // 秘密の合言葉（Clerkがくれたシークレット）が設定されてるか確認。ないと安全に受け取れないのでエラー返す。

  const h = headers();
  const svix_id = h.get("svix-id");
  const svix_timestamp = h.get("svix-timestamp");
  const svix_signature = h.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }
  //封筒にある配達員の身分証（3つのヘッダー）が入ってるかチェック。1つでも無ければ受け取り拒否（400）。

  const payload = await req.text();
  // 荷物の中身（本文）を文字列で受け取る。署名チェックは文字列のままやるのがルール。

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  // Svix で署名を検証。本物なら evt にイベントの中身（オブジェクト）が入る。偽物なら 400。

  // イベントの種類で分岐。新規ユーザーが作られた時の処理だけ今は書いてる。
  if (evt.type === "user.created") {
    const d = evt.data ?? {}; // d は Clerk のユーザーデータ。
    const clerkId: string = d.id; // clerkId は Clerk 側のユーザーID（あなたのDBで一意のカギに使う）。

    // ① username の候補を作る（username → email のローカル部 → 'user_XXXX'）
    const primaryEmailId: string | undefined = d.primary_email_address_id;
    const email = Array.isArray(d.email_addresses)
      ? d.email_addresses.find((e: any) => e.id === primaryEmailId)
          ?.email_address
      : undefined;

    const baseUsername =
      d.username ??
      (email ? email.split("@")[0] : undefined) ??
      `user_${String(clerkId).slice(0, 8)}`;

    // ② 既存衝突を避けて一意な username を作る
    const uniqueUsername = await ensureUniqueUsername(baseUsername);

    // ③ 表示名
    const name: string | null =
      d.first_name && d.last_name
        ? `${d.first_name} ${d.last_name}`
        : d.first_name ?? d.last_name ?? uniqueUsername;

    const image = d.image_url ?? null;

    // ④ clerkId をキーに upsert（再送にも強い）
    await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        username: uniqueUsername,
        name,
        image,
      },
      update: {
        // created 後に差分があれば同期
        username: uniqueUsername,
        name,
        image,
      },
    });

    return new Response("user.created handled", { status: 200 });
  }

  // 他イベントはとりあえず 200 で ACK
  return new Response("ok", { status: 200 });
}

// username の重複を避ける（例: yuna, yuna_1, yuna_2, ...）
async function ensureUniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let i = 1;
  // ループは安全のため上限を設ける
  while (i <= 50) {
    const exists = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!exists) return candidate;
    candidate = `${base}_${i++}`;
  }
  // ここに来ることは稀だが、最終フォールバック
  return `${base}_${Math.random().toString(36).slice(2, 7)}`;
}
