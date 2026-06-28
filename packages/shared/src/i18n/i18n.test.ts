import assert from "node:assert/strict";
import { test } from "node:test";
import { directionFor, isRtl, translate } from "./index.js";

test("directionFor maps locales to text direction", () => {
  assert.equal(directionFor("he"), "rtl");
  assert.equal(directionFor("en"), "ltr");
  assert.equal(isRtl("he"), true);
  assert.equal(isRtl("en"), false);
});

test("translate resolves keys per locale", () => {
  assert.equal(translate("en", "nav.home"), "Home");
  assert.equal(translate("he", "nav.home"), "בית");
  assert.equal(translate("he", "body.recovery"), "התאוששות");
});

test("translate falls back to the key when missing", () => {
  assert.equal(translate("he", "nav.does_not_exist"), "nav.does_not_exist");
});
