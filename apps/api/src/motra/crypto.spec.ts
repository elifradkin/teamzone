import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "./crypto";

describe("token encryption", () => {
  beforeAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  });

  it("round-trips a value", () => {
    const secret = JSON.stringify({ access: "abc", refresh: "def" });
    const blob = encrypt(secret);
    expect(blob).not.toContain("abc");
    expect(decrypt(blob)).toBe(secret);
  });

  it("produces different ciphertext each time (random IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects tampered ciphertext", () => {
    const blob = encrypt("important");
    const parts = blob.split(":");
    const tampered = `${parts[0]}:${parts[1]}:${"0".repeat(parts[2].length)}`;
    expect(() => decrypt(tampered)).toThrow();
  });
});
