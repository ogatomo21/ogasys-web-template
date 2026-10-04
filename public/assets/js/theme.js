(() => {
  const key = "ogasys-theme";
  const modes = ["system", "light", "dark"];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let mode = "system";
  let persisted = true;
  try {
    const saved = window.localStorage.getItem(key);
    if (modes.includes(saved)) mode = saved;
  } catch {
    persisted = false;
  }

  function get() {
    return { mode, effective: mode === "system" ? (media.matches ? "dark" : "light") : mode, persisted };
  }
  function apply() {
    const state = get();
    document.documentElement.classList.toggle("dark", state.effective === "dark");
    document.documentElement.dataset.theme = state.mode;
    window.dispatchEvent(new CustomEvent("ogasys:theme", { detail: state }));
  }
  function set(next) {
    if (!modes.includes(next)) return;
    mode = next;
    try {
      window.localStorage.setItem(key, mode);
      persisted = true;
    } catch {
      persisted = false;
    }
    apply();
  }
  const onChange = () => { if (mode === "system") apply(); };
  // 古いSafariでもシステムテーマの変更を検知します。
  if (media.addEventListener) media.addEventListener("change", onChange);
  else media.addListener(onChange);
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    mode = modes.includes(event.newValue) ? event.newValue : "system";
    apply();
  });
  window.OgaTheme = { get, set };
  apply();
})();
