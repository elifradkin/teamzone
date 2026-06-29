import assert from "node:assert/strict";
import { test } from "node:test";
import { dir, t } from "./i18n";

test("dir maps locales to text direction", () => {
  assert.equal(dir("he"), "rtl");
  assert.equal(dir("en"), "ltr");
});

test("t resolves per locale and falls back to the key", () => {
  assert.equal(t("en", "auth.signIn"), "Sign in");
  assert.equal(t("he", "auth.signIn"), "התחברות");
  assert.equal(t("he", "missing.key"), "missing.key");
});
