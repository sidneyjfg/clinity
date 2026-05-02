import * as crypto from "node:crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!env.JWT_ACCESS_SECRET) throw new Error("Encryption secret not configured.");
  
  // Usamos o JWT_ACCESS_SECRET como base para a chave, garantindo 32 bytes
  const key = crypto.createHash("sha256").update(env.JWT_ACCESS_SECRET).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(text: string): string {
  if (!env.JWT_ACCESS_SECRET) throw new Error("Encryption secret not configured.");

  const key = crypto.createHash("sha256").update(env.JWT_ACCESS_SECRET).digest();
  const [ivHex, encryptedHex] = text.split(":");
  if (!ivHex || !encryptedHex) return text; // Fallback para texto plano se não estiver no formato esperado

  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}
