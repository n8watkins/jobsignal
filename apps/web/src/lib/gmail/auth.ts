import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

function encryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY ?? "dev-encryption-key-change-in-production";
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", encryptionKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleRefreshToken) {
    throw new Error("Gmail not connected. Connect via Settings.");
  }

  const expiry = user.googleTokenExpiry;
  const bufferMs = 60_000; // refresh 1 minute before expiry
  const needsRefresh = !user.googleAccessToken || !expiry || expiry.getTime() - bufferMs < Date.now();

  if (!needsRefresh && user.googleAccessToken) {
    return decrypt(user.googleAccessToken);
  }

  const refreshToken = decrypt(user.googleRefreshToken);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: encrypt(data.access_token),
      googleTokenExpiry: newExpiry,
    },
  });

  return data.access_token;
}
