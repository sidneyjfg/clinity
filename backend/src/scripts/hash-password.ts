import { hashPassword } from "../utils/password";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Usage: npm --prefix backend run hash:password -- <password-with-at-least-8-chars>");
  process.exit(1);
}

console.log(hashPassword(password));
