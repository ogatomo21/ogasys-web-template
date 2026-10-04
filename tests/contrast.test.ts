import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../src/styles.css", import.meta.url), "utf8");
function luminance(rgb: number[]) {
  const values = rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a: number[], b: number[]) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}
for (const selector of [":root", ":root.dark"]) {
  test(`${selector}: 本文・補助文字・リンクのコントラスト`, () => {
    const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
    const tokens = Object.fromEntries(Array.from(block.matchAll(/--([\w-]+): ([\d ]+);/g), match => [match[1], match[2].split(" ").map(Number)]));
    for (const foreground of ["foreground", "muted", "link"]) {
      for (const background of ["background", "surface", "surface-alt"]) {
        const ratio = contrast(tokens[foreground], tokens[background]);
        assert.ok(ratio >= 4.5, `${foreground}/${background}: ${ratio.toFixed(2)}`);
      }
    }
  });
  test(`${selector}: 入力欄の境界は背景と3:1以上`, () => {
    const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
    const tokens = Object.fromEntries(Array.from(block.matchAll(/--([\w-]+): ([\d ]+);/g), match => [match[1], match[2].split(" ").map(Number)]));
    for (const background of ["background", "surface", "surface-alt"]) {
      assert.ok(contrast(tokens["control-border"], tokens[background]) >= 3);
    }
  });
}
test("Dangerボタンの通常文字", () => {
  for (const [background, foreground] of [
    [[235, 35, 35], [0, 0, 0]], [[240, 68, 68], [0, 0, 0]]
  ]) assert.ok(contrast(background, foreground) >= 4.5);
});
