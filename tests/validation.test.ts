import test from "node:test";
import assert from "node:assert/strict";
import { validateDemoInput } from "../src/demo/validation.js";

test("名前80文字・説明500文字は受け付ける", () => {
  assert.equal(validateDemoInput({ name: "a".repeat(80), description: "あ".repeat(500) }).ok, true);
});
test("名前81文字・説明501文字は拒否", () => {
  const result = validateDemoInput({ name: "a".repeat(81), description: "あ".repeat(501) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.deepEqual(result.fields, {
    name: "名前は80文字以内で入力してください。1文字超過しています。",
    description: "説明は500文字以内で入力してください。1文字超過しています。"
  });
});

test("前後の空白を除いた文字数で超過を表示し、入力は切り詰めない", () => {
  const result = validateDemoInput({ name: `  ${"あ".repeat(85)}  `, description: "説".repeat(510) });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.fields.name, /5文字超過/);
    assert.match(result.fields.description, /10文字超過/);
  }
});
test("説明の省略と不要なプロパティ", () => {
  assert.deepEqual(validateDemoInput({ name: "name", ignored: "value" }), { ok: true, data: { name: "name", description: "" } });
});
test("空白だけの名前を拒否", () => {
  assert.equal(validateDemoInput({ name: " \n\t　" }).ok, false);
});
test("オブジェクト以外を拒否", () => {
  for (const input of [null, [], "name", 123, true]) assert.equal(validateDemoInput(input).ok, false);
});
test("項目の型を検証", () => {
  for (const name of [null, 1, true, {}, []]) assert.equal(validateDemoInput({ name }).ok, false);
  for (const description of [null, 1, true, {}, []]) assert.equal(validateDemoInput({ name: "a", description }).ok, false);
});
