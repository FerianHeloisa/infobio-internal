async function loadPage(page) {
  const res = await fetch(`assets/pages/${page}.html`);
  const html = await res.text();
  const container = document.getElementById("page-container");
  container.innerHTML = html;

  // re-icones
  if (window.lucide) lucide.createIcons();

  // chama o init certo, se existir
  const fnName = "init" + page.charAt(0).toUpperCase() + page.slice(1);
  if (typeof window[fnName] === "function") {
    window[fnName]();
  }
}
