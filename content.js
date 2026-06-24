// content.js — inietta la sidebar come iframe fisso a destra.
// Questo approccio non usa chrome.sidePanel (non supportata da Opera GX).

(function () {
  const HOST_ID = "claude-gx-sidebar-host";
  const WIDTH = 400;

  function getHost() {
    return document.getElementById(HOST_ID);
  }

  function mount() {
    if (getHost()) return getHost();

    const host = document.createElement("div");
    host.id = HOST_ID;
    Object.assign(host.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: WIDTH + "px",
      height: "100vh",
      zIndex: "2147483647",
      border: "none",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.45)",
      transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
      transform: "translateX(100%)"
    });

    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("sidebar/sidebar.html");
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      colorScheme: "dark"
    });
    iframe.setAttribute("allow", "clipboard-write");

    host.appendChild(iframe);
    document.documentElement.appendChild(host);

    // animazione di entrata
    requestAnimationFrame(() => {
      host.style.transform = "translateX(0)";
    });
    return host;
  }

  function isOpen() {
    const h = getHost();
    return h && h.style.transform === "translateX(0px)";
  }

  function open() {
    const h = mount();
    requestAnimationFrame(() => (h.style.transform = "translateX(0)"));
  }

  function close() {
    const h = getHost();
    if (h) h.style.transform = "translateX(100%)";
  }

  function toggle() {
    if (isOpen()) close();
    else open();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_SIDEBAR") toggle();
    if (msg.type === "PREFILL") {
      open();
      const h = getHost();
      const iframe = h && h.querySelector("iframe");
      if (iframe) {
        iframe.contentWindow.postMessage({ type: "PREFILL", text: msg.text }, "*");
      }
    }
  });

  // Estrae il testo leggibile della pagina, privilegiando il contenuto principale.
  function extractPageContent() {
    const MAX = 40000; // limite caratteri per non sforare token/costi
    const main =
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.querySelector("[role='main']") ||
      document.body;
    let text = (main.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
    let truncated = false;
    if (text.length > MAX) {
      text = text.slice(0, MAX);
      truncated = true;
    }
    return { title: document.title, url: location.href, text, truncated };
  }

  // Messaggi dall'iframe della sidebar.
  window.addEventListener("message", (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === "CLAUDE_GX_CLOSE") close();
    if (e.data.type === "GET_PAGE_CONTENT") {
      const payload = extractPageContent();
      if (e.source) e.source.postMessage({ type: "PAGE_CONTENT", ...payload }, "*");
    }
  });
})();
