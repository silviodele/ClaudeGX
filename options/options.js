// options.js
const MODELS = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (consigliato)" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (più potente)" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (più veloce/economico)" }
];

const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("model");
const statusEl = document.getElementById("status");
const saveEl = document.getElementById("save");
const toggleEl = document.getElementById("toggle");

MODELS.forEach((m) => {
  const o = document.createElement("option");
  o.value = m.id;
  o.textContent = m.label;
  modelEl.appendChild(o);
});

(async function load() {
  const s = await chrome.storage.local.get(["apiKey", "model"]);
  if (s.apiKey) apiKeyEl.value = s.apiKey;
  modelEl.value = s.model || MODELS[0].id;
})();

toggleEl.addEventListener("click", () => {
  apiKeyEl.type = apiKeyEl.type === "password" ? "text" : "password";
});

saveEl.addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiKey: apiKeyEl.value.trim(),
    model: modelEl.value
  });
  flash("Salvato ✓");
});

function flash(text) {
  statusEl.textContent = text;
  statusEl.classList.add("show");
  setTimeout(() => statusEl.classList.remove("show"), 1800);
}

// --- Backup ---------------------------------------------------------------

document.getElementById("export").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(["apiKey", "model"]);
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "claude-gx-settings.json";
  a.click();
  URL.revokeObjectURL(url);
  flash("Esportato ✓");
});

const importFile = document.getElementById("import-file");
document.getElementById("import").addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const patch = {};
      if (typeof data.apiKey === "string") patch.apiKey = data.apiKey;
      if (typeof data.model === "string") patch.model = data.model;
      await chrome.storage.local.set(patch);
      if (patch.apiKey) apiKeyEl.value = patch.apiKey;
      if (patch.model) modelEl.value = patch.model;
      flash("Importato ✓");
    } catch (e) {
      flash("File non valido");
    }
    importFile.value = "";
  };
  reader.readAsText(file);
});
