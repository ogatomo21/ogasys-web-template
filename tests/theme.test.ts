import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../public/assets/js/theme.js", import.meta.url), "utf8");
type ThemeState = { mode: string; effective: string; persisted: boolean };
type Listener = (event?: any) => void;

function setup({ saved = null, dark = false, blocked = false, legacy = false }: { saved?: string | null; dark?: boolean; blocked?: boolean; legacy?: boolean } = {}) {
  const listeners: Record<string, Listener> = {};
  const classes = new Set<string>();
  let mediaListener: Listener;
  let stored = saved;
  const media = {
    matches: dark,
    addEventListener: legacy ? undefined : (_type: string, fn: Listener) => { mediaListener = fn; },
    addListener: (fn: Listener) => { mediaListener = fn; }
  };
  const window = {
    OgaTheme: undefined as unknown as { get(): ThemeState; set(mode: string): void },
    matchMedia: () => media,
    localStorage: {
      getItem: () => { if (blocked) throw new Error("blocked"); return stored; },
      setItem: (_key: string, value: string) => { if (blocked) throw new Error("blocked"); stored = value; }
    },
    addEventListener: (type: string, fn: Listener) => { listeners[type] = fn; },
    dispatchEvent: () => {}
  };
  const document = { documentElement: { dataset: {}, classList: { toggle: (name: string, value: boolean) => value ? classes.add(name) : classes.delete(name) } } };
  runInNewContext(source, { window, document, CustomEvent: class {} });
  return {
    theme: window.OgaTheme,
    isDark: () => classes.has("dark"),
    saved: () => stored,
    changeSystem: (value: boolean) => { media.matches = value; mediaListener(); },
    storage: (key: string | null, newValue: string | null) => listeners.storage({ key, newValue })
  };
}

test("初回描画前に保存されたダークテーマを適用", () => {
  const env = setup({ saved: "dark" });
  assert.equal(env.isDark(), true);
  assert.equal(env.theme.get().mode, "dark");
});
test("未保存と不正な設定はシステム追従", () => {
  for (const saved of [null, "invalid"]) {
    const env = setup({ saved, dark: true });
    assert.equal(env.theme.get().mode, "system");
    assert.equal(env.isDark(), true);
    env.changeSystem(false);
    assert.equal(env.isDark(), false);
  }
});
test("明示的なライト設定はOS変更の影響を受けない", () => {
  const env = setup({ saved: "light", dark: true });
  env.changeSystem(false);
  env.changeSystem(true);
  assert.equal(env.isDark(), false);
});
test("設定を保存し、システム追従へ戻せる", () => {
  const env = setup({ dark: true });
  env.theme.set("light");
  assert.equal(env.saved(), "light");
  assert.equal(env.isDark(), false);
  env.theme.set("system");
  assert.equal(env.isDark(), true);
  env.theme.set("unknown");
  assert.equal(env.saved(), "system");
});
test("localStorageが拒否されても設定を変更できる", () => {
  const env = setup({ blocked: true });
  env.theme.set("dark");
  assert.equal(env.isDark(), true);
  assert.equal(env.theme.get().persisted, false);
});
test("古いSafariのaddListenerを使用", () => {
  const env = setup({ legacy: true });
  env.changeSystem(true);
  assert.equal(env.isDark(), true);
});
test("他タブでの設定変更とstorage.clearに追従", () => {
  const env = setup();
  env.storage("ogasys-theme", "dark");
  assert.equal(env.isDark(), true);
  env.storage("other", "light");
  assert.equal(env.isDark(), true);
  env.storage(null, null);
  assert.equal(env.theme.get().mode, "system");
  assert.equal(env.isDark(), false);
});
