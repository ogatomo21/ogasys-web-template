(() => {
  const themeButtons = document.querySelectorAll("button[data-theme-opt]");
  const themeStatus = document.getElementById("theme-status");
  const names = { system: "システム", light: "ライト", dark: "ダーク" };
  const modes = Object.keys(names);
  let previousTheme;
  let animationTimer;
  function updateTheme() {
    if (!window.OgaTheme) return;
    const { mode, effective, persisted } = window.OgaTheme.get();
    const nextTheme = mode + effective;
    if (previousTheme && previousTheme !== nextTheme && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("theme-switching");
      window.clearTimeout(animationTimer);
      animationTimer = window.setTimeout(() => document.documentElement.classList.remove("theme-switching"), 280);
    }
    previousTheme = nextTheme;
    for (const button of themeButtons) {
      const selected = button.dataset.themeOpt === mode;
      button.disabled = false;
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    if (themeStatus) themeStatus.textContent = `${names[mode]}（現在：${names[effective]}）${persisted ? " · このブラウザーに保存" : " · 保存できないため、このページのみ適用"}`;
  }
  for (const button of themeButtons) {
    button.addEventListener("click", () => window.OgaTheme?.set(button.dataset.themeOpt));
    button.addEventListener("keydown", event => {
      const index = modes.indexOf(button.dataset.themeOpt);
      let next;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % modes.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + modes.length - 1) % modes.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = modes.length - 1;
      else return;
      event.preventDefault();
      window.OgaTheme?.set(modes[next]);
      button.closest(".theme-switch").querySelectorAll("button")[next].focus();
    });
  }
  window.addEventListener("ogasys:theme", updateTheme);
  updateTheme();

  const menu = document.getElementById("mobile-nav");
  const toggle = document.getElementById("menu-toggle");
  const menuIcon = toggle.querySelector("use");
  const menuLabel = toggle.querySelector("span");
  const desktop = window.matchMedia("(min-width: 768px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let opened = false;
  let menuAnimation;
  function setMenu(open, restoreFocus = false, animate = true) {
    const height = menu.hidden ? 0 : menu.getBoundingClientRect().height;
    const opacity = menu.hidden ? 0 : Number(getComputedStyle(menu).opacity);
    menuAnimation?.cancel();
    menuAnimation = undefined;
    opened = open;
    const focusInMenu = menu.contains(document.activeElement);
    menu.hidden = false;
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    menuIcon.setAttribute("href", `/assets/icons.svg#${open ? "close" : "menu"}`);
    menuLabel.textContent = open ? "閉じる" : "メニュー";
    if (!open && (restoreFocus || focusInMenu)) {
      const target = desktop.matches
        ? document.querySelector('#desktop-nav [aria-current="page"]') || document.querySelector("#desktop-nav a")
        : toggle;
      target.focus({ preventScroll: true });
    }
    if (!animate || reducedMotion.matches || !menu.animate) {
      menu.hidden = !open;
    } else {
      const animation = menu.animate([
        { height: height + "px", opacity },
        { height: (open ? menu.scrollHeight : 0) + "px", opacity: open ? 1 : 0 }
      ], { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" });
      menuAnimation = animation;
      animation.onfinish = () => {
        if (menuAnimation !== animation) return;
        menu.hidden = !opened;
        menuAnimation = undefined;
        // 高さをautoへ戻し、文字の折り返しや幅変更に対応する。
        animation.cancel();
      };
    }
    if (open) menu.querySelector("a").focus({ preventScroll: true });
  }
  toggle.hidden = false;
  toggle.addEventListener("click", () => setMenu(!opened, true));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && opened) { event.preventDefault(); setMenu(false, true); }
  });
  document.addEventListener("click", event => {
    if (opened && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  document.addEventListener("focusin", event => {
    if (!opened && menu.contains(event.target)) toggle.focus({ preventScroll: true });
  });
  const onResize = () => { if (desktop.matches) setMenu(false, false, false); };
  if (desktop.addEventListener) desktop.addEventListener("change", onResize);
  else desktop.addListener(onResize);
  const onMotionChange = () => { if (reducedMotion.matches) menuAnimation?.finish(); };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionChange);
  else reducedMotion.addListener(onMotionChange);
})();
