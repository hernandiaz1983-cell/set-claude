/***********************
 * APP.JS
 ***********************/

/***********************
 * CONFIG VERSION
 ***********************/
const VERSION_LABEL = "APP BETA CLAUDE 1.0";
const BUILD_DATE = "2026-04-17";
const EXPIRY_DATE = new Date(2026, 4, 20, 0, 0, 0); // 20 Mayo 2026 00:00 hora local

function checkExpiry() {
  if (new Date() >= EXPIRY_DATE) {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0c1526;color:#f59e0b;font-family:'Segoe UI',sans-serif;text-align:center;padding:2rem;">
        <img src="imagenes/icon-sf.svg" style="width:80px;margin-bottom:2rem;opacity:0.8;">
        <h2 style="font-size:1.4rem;margin-bottom:1rem;color:#f59e0b;letter-spacing:1px;">SU VERSIÓN DE PRUEBA HA TERMINADO</h2>
        <p style="color:#94a3b8;font-size:0.9rem;">Contacte al administrador para renovar su acceso.</p>
      </div>`;
    return true;
  }
  return false;
}

const TEMPLATE_LIBRARY_KEY = "set_template_library_v1";
const TEMPLATE_LIBRARY_MAX = 5;
const ACTIVE_TEMPLATE_KEY = "set_active_template_v1";
const NEW_TEMPLATE_SIZE_KEY = "set_new_template_size_v1";
const NEW_TEMPLATE_DEFAULT_SIZE = "carta";
const NEW_TEMPLATE_FONT_KEY = "set_new_template_font_v1";
const NEW_TEMPLATE_DEFAULT_FONT = "calibri";
const NEW_TEMPLATE_MEMBRETE_MODE_KEY = "set_new_template_membrete_mode_v1";
const NEW_TEMPLATE_MEMBRETE_TEXT_KEY = "set_new_template_membrete_text_v1";
const NEW_TEMPLATE_MEMBRETE_IMAGE_KEY = "set_new_template_membrete_image_v1";
const NEW_TEMPLATE_MARGIN_LEFT_KEY = "set_new_template_margin_left_v1";
const NEW_TEMPLATE_MARGIN_RIGHT_KEY = "set_new_template_margin_right_v1";
const NEW_TEMPLATE_MARGIN_TOP_KEY = "set_new_template_margin_top_v1";
const NEW_TEMPLATE_MARGIN_BOTTOM_KEY = "set_new_template_margin_bottom_v1";
const NEW_TEMPLATE_DEFAULT_MARGIN_SIDE = 2.0;
const NEW_TEMPLATE_NOTE_COLOR_KEY = "set_new_template_note_color_v1";
const NEW_TEMPLATE_DEFAULT_NOTE_COLOR = "red";
const NEW_TEMPLATE_SIGNATURE_NAME_KEY = "set_new_template_sig_name_v1";
const NEW_TEMPLATE_SIGNATURE_RANK_KEY = "set_new_template_sig_rank_v1";
const NEW_TEMPLATE_SIGNATURE_IMAGE_KEY = "set_new_template_sig_image_v1";
const EDIT_TEMPLATE_ID_KEY = "set_edit_template_id_v1";
const DRAFTS_KEY = "set_drafts_v1";
const CURRENT_DRAFT_ID_KEY = "set_current_draft_id_v1";
const DRAFTS_MAX = 10;
const PDF_LIBRARY_KEY = "set_pdf_library_v1";
const PDF_LIBRARY_MAX = 10;
const REPORT_MEMBRETE_KEY = "set_report_membrete_v1";
const REPORT_MEMBRETE_MODE_KEY = "set_report_membrete_mode_v1";
const REPORT_MEMBRETE_TEXT_KEY = "set_report_membrete_text_v1";
const REPORT_MEMBRETE_IMAGE_KEY = "set_report_membrete_image_v1";
const REPORT_NOTE_COLOR_KEY = "set_report_note_color_v1";
const REPORT_SIG_IMAGE_KEY = "set_report_sig_image_v1";
const DAILY_COUNTER_PREFIX = "set_daily_cnt_";

function isReportMembreteEnabled(){
  const v = localStorage.getItem(REPORT_MEMBRETE_KEY);
  if (v === null) return true;
  return v === "1";
}

function setReportMembreteEnabled(v){
  localStorage.setItem(REPORT_MEMBRETE_KEY, v ? "1" : "0");
}

function selectReportMembrete(use){
  setReportMembreteEnabled(!!use);
  cambiarPaso(2);
}

function getReportMembreteMode(){
  return "text";
}

function setReportMembreteMode(value){
  localStorage.setItem(REPORT_MEMBRETE_MODE_KEY, value);
  renderReportMembreteUI();
}

function getReportMembreteTextLines(){
  try {
    const raw = localStorage.getItem(REPORT_MEMBRETE_TEXT_KEY);
    const lines = raw ? JSON.parse(raw) : ["", "", ""];
    return Array.isArray(lines) ? lines : ["", "", ""];
  } catch (_) {
    return ["", "", ""];
  }
}

function setReportMembreteTextLines(lines){
  localStorage.setItem(REPORT_MEMBRETE_TEXT_KEY, JSON.stringify(lines || ["", "", ""]));
}

function getReportMembreteImage(){
  return localStorage.getItem(REPORT_MEMBRETE_IMAGE_KEY) || "";
}

function setReportMembreteImage(dataUrl){
  if (dataUrl) localStorage.setItem(REPORT_MEMBRETE_IMAGE_KEY, dataUrl);
  else localStorage.removeItem(REPORT_MEMBRETE_IMAGE_KEY);
}

function getReportNoteColor(){
  const saved = localStorage.getItem(REPORT_NOTE_COLOR_KEY);
  if (saved) return saved;
  const tplColor = String(getActiveTemplate()?.noteColor || "").toLowerCase();
  if (["black", "red", "blue", "yellow"].includes(tplColor)) return tplColor;
  return "black";
}

const NOTE_COLOR_ES = { black: "NEGRO", red: "ROJO", blue: "AZUL", yellow: "AMARILLO" };
const NOTE_COLOR_HEX = { black: "#1a1f36", red: "#dc2626", blue: "#2563eb", yellow: "#b45309" };

function setReportNoteColor(value){
  localStorage.setItem(REPORT_NOTE_COLOR_KEY, value);
  renderReportNoteColorUI();
  applyNoteTextareaColor();
  closeSubmenu("reportNoteMenu");
}

function applyNoteTextareaColor(){
  const ta = document.getElementById("final_conclusion");
  if (!ta) return;
  const color = getReportNoteColor();
  ta.style.color = NOTE_COLOR_HEX[color] || NOTE_COLOR_HEX.black;
  ta.style.fontWeight = color !== "black" ? "700" : "normal";
}

function renderReportNoteColorUI(){
  const color = String(getReportNoteColor() || "").toLowerCase();
  const toggle = document.getElementById("reportNoteToggle");
  const btnBlack = document.getElementById("reportNoteBlack");
  const btnRed = document.getElementById("reportNoteRed");
  const btnBlue = document.getElementById("reportNoteBlue");
  const btnYellow = document.getElementById("reportNoteYellow");
  const label = NOTE_COLOR_ES[color] || color.toUpperCase();
  if (toggle) toggle.textContent = `COLOR: ${label}`;
  if (btnBlack) btnBlack.classList.toggle("active", color === "black");
  if (btnRed) btnRed.classList.toggle("active", color === "red");
  if (btnBlue) btnBlue.classList.toggle("active", color === "blue");
  if (btnYellow) btnYellow.classList.toggle("active", color === "yellow");
}

function toggleReportNoteMenu(){
  const menu = document.getElementById("reportNoteMenu");
  if (menu) menu.classList.toggle("open");
  renderReportNoteColorUI();
}

function renderReportMembreteUI(){
  // Siempre modo texto (la UI de imagen fue eliminada de s8)
  const lines = getReportMembreteTextLines();
  const l1 = document.getElementById("reportMembreteLine1");
  const l2 = document.getElementById("reportMembreteLine2");
  const l3 = document.getElementById("reportMembreteLine3");
  if (l1 && l1.value !== (lines[0] || "")) l1.value = lines[0] || "";
  if (l2 && l2.value !== (lines[1] || "")) l2.value = lines[1] || "";
  if (l3 && l3.value !== (lines[2] || "")) l3.value = lines[2] || "";
}

function selectReportMembreteMode(value){
  setReportMembreteMode(value);
  if (value === "image") {
    const input = document.getElementById("reportMembreteImageInput");
    if (input) input.click();
  }
}

function updateReportMembreteText(){
  const l1 = document.getElementById("reportMembreteLine1");
  const l2 = document.getElementById("reportMembreteLine2");
  const l3 = document.getElementById("reportMembreteLine3");
  setReportMembreteTextLines([
    (l1?.value || "").trim(),
    (l2?.value || "").trim(),
    (l3?.value || "").trim()
  ]);
}

async function fileToJpegDataUrl(file, maxSide){
  const url = URL.createObjectURL(file);
  try{
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext("2d", { alpha: false });
    ctx2.fillStyle = "#fff";
    ctx2.fillRect(0, 0, w, h);
    ctx2.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handleReportMembreteImage(file){
  if (!file) {
    setReportMembreteImage("");
    renderReportMembreteUI();
    return;
  }
  try{
    const dataUrl = await fileToJpegDataUrl(file, 800);
    setReportMembreteImage(String(dataUrl || ""));
    renderReportMembreteUI();
  } catch (e) {
    alert("No se pudo cargar la imagen del membrete.");
  }
}

function useReportMembrete(){
  setReportMembreteEnabled(true);
  cambiarPaso(2);
}

// ── FIRMA DIGITAL (informe actual, s4) ──────────────────────────────────────
function getReportSigImage(){
  return localStorage.getItem(REPORT_SIG_IMAGE_KEY) || "";
}
function setReportSigImage(dataUrl){
  if (dataUrl) localStorage.setItem(REPORT_SIG_IMAGE_KEY, dataUrl);
  else localStorage.removeItem(REPORT_SIG_IMAGE_KEY);
}
async function handleSigImage(file){
  if (!file){ setReportSigImage(""); renderSigImageUI(); return; }
  try{
    const dataUrl = await fileToJpegDataUrl(file, 800);
    setReportSigImage(String(dataUrl || ""));
    renderSigImageUI();
  }catch(e){ alert("No se pudo cargar la imagen de firma."); }
}
function clearSigImage(){
  setReportSigImage("");
  const input = document.getElementById("sigImageInput");
  if (input) input.value = "";
  renderSigImageUI();
}
function renderSigImageUI(){
  const wrap = document.getElementById("sigImagePreviewWrap");
  const img = document.getElementById("sigImagePreview");
  const dataUrl = getReportSigImage();
  if (!wrap || !img) return;
  if (dataUrl){ img.src = dataUrl; wrap.style.display = "block"; }
  else { img.src = ""; wrap.style.display = "none"; }
}

// ── FIRMA DIGITAL (plantilla, s7) ─────────────────────────────────────────
function getTemplateSigImage(){
  return localStorage.getItem(NEW_TEMPLATE_SIGNATURE_IMAGE_KEY) || "";
}
function setTemplateSigImage(dataUrl){
  if (dataUrl) localStorage.setItem(NEW_TEMPLATE_SIGNATURE_IMAGE_KEY, dataUrl);
  else localStorage.removeItem(NEW_TEMPLATE_SIGNATURE_IMAGE_KEY);
}
async function handleTemplateSigImage(file){
  if (!file){ setTemplateSigImage(""); renderTemplateSigImageUI(); return; }
  try{
    const dataUrl = await fileToJpegDataUrl(file, 800);
    setTemplateSigImage(String(dataUrl || ""));
    renderTemplateSigImageUI();
  }catch(e){ alert("No se pudo cargar la imagen de firma."); }
}
function clearTemplateSigImage(){
  setTemplateSigImage("");
  const input = document.getElementById("templateSigImageInput");
  if (input) input.value = "";
  renderTemplateSigImageUI();
}
function renderTemplateSigImageUI(){
  const wrap = document.getElementById("templateSigImagePreviewWrap");
  const img = document.getElementById("templateSigImagePreview");
  const dataUrl = getTemplateSigImage();
  if (!wrap || !img) return;
  if (dataUrl){ img.src = dataUrl; wrap.style.display = "block"; }
  else { img.src = ""; wrap.style.display = "none"; }
}

// ── CÓDIGO CORRELATIVO DIARIO (DDMMYYYY-XX) ───────────────────────────────
function generateReportCode(){
  const now = new Date();
  const dd = now.getDate().toString().padStart(2, "0");
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const dateKey = `${dd}${mm}${yyyy}`;
  const storageKey = DAILY_COUNTER_PREFIX + dateKey;
  let counter = parseInt(localStorage.getItem(storageKey) || "0", 10);
  counter++;
  localStorage.setItem(storageKey, counter.toString());
  return `${dateKey}-${counter.toString().padStart(2, "0")}`;
}

// ── COMPARTIR PDF ────────────────────────────────────────────────────────
async function sharePdfFromLibrary(id){
  const Share = window.Capacitor?.Plugins?.Share;
  const Filesystem = window.Capacitor?.Plugins?.Filesystem;
  const list = loadPdfLibrary();
  const item = list.find(p => p.id === id);
  if (!item?.dataUrl){ alert("No se encontró el PDF."); return; }

  if (!Share || !Filesystem){
    // Fallback: abrir en nueva pestaña
    window.open(item.dataUrl, "_blank");
    return;
  }

  try{
    const b64 = item.dataUrl.includes(",") ? item.dataUrl.split(",")[1] : item.dataUrl;
    const fileName = (item.name || "reporte") + ".pdf";
    await Filesystem.writeFile({ path: fileName, data: b64, directory: "CACHE", recursive: true });
    const uriResult = await Filesystem.getUri({ path: fileName, directory: "CACHE" });
    await Share.share({
      title: item.name || "Reporte fotográfico",
      text: "Compartir informe fotográfico",
      url: uriResult.uri,
      dialogTitle: "Compartir PDF"
    });
  }catch(e){
    console.error("Error al compartir:", e);
    alert("No se pudo compartir el PDF.");
  }
}

function toggleOptionsMenu(){
  const menu = document.getElementById("optionsMenu");
  if (menu) menu.classList.toggle("open");
}

function closeOptionsSubmenus(exceptId){
  const ids = ["templatesMenu", "templateLibrary", "draftsMenu", "pdfLibraryMenu"];
  ids.forEach((id) => {
    if (id === exceptId) return;
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  });
}

function toggleTemplatesMenu(){
  closeOptionsSubmenus("templatesMenu");
  const menu = document.getElementById("templatesMenu");
  if (menu) menu.classList.toggle("open");
}

function toggleTemplateLibrary(){
  closeOptionsSubmenus("templateLibrary");
  const lib = document.getElementById("templateLibrary");
  if (lib) lib.classList.toggle("open");
  renderTemplateLibrary();
}

function toggleDraftsMenu(){
  closeOptionsSubmenus("draftsMenu");
  const menu = document.getElementById("draftsMenu");
  if (menu) menu.classList.toggle("open");
  renderDrafts();
}

function togglePdfLibraryMenu(){
  closeOptionsSubmenus("pdfLibraryMenu");
  const menu = document.getElementById("pdfLibraryMenu");
  if (menu) menu.classList.toggle("open");
  renderPdfLibrary();
}

function loadPdfLibrary(){
  try {
    const raw = localStorage.getItem(PDF_LIBRARY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function savePdfLibrary(list){
  const data = JSON.stringify(list || []);
  try {
    localStorage.setItem(PDF_LIBRARY_KEY, data);
    return;
  } catch (_) {}
  // Quota exceeded: intentar sin dataUrl en entradas antiguas
  try {
    const slim = (list || []).map((p, i) => i === 0 ? p : { ...p, dataUrl: "" });
    localStorage.setItem(PDF_LIBRARY_KEY, JSON.stringify(slim));
    return;
  } catch (_) {}
  // Último recurso: solo la entrada más reciente sin dataUrl
  try {
    const newest = (list || []).length ? [{ ...(list[0]), dataUrl: "" }] : [];
    localStorage.setItem(PDF_LIBRARY_KEY, JSON.stringify(newest));
    return;
  } catch (_) {}
  console.warn("Biblioteca PDF: cuota de almacenamiento excedida, se omite guardar.");
}

function renderPdfLibrary(){
  const list = loadPdfLibrary();
  const html = list.length
    ? list.map((p) => {
      const name = String(p?.name || "PDF");
      const date = p?.createdAt ? new Date(p.createdAt).toLocaleString("es-CL") : "";
      return `
      <div class="template-item">
        <div class="template-name">${name}</div>
        <div class="small-note">${date}</div>
        <div style="margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <button class="btn-ok btn-mini" onclick="openPdfFromLibrary('${p.id}')">ABRIR</button>
          <button class="btn-sec btn-mini" onclick="deletePdfFromLibrary('${p.id}')">Eliminar</button>
        </div>
        <button class="btn-main btn-mini" style="margin-top:6px;" onclick="sharePdfFromLibrary('${p.id}')">📤 COMPARTIR</button>
      </div>
    `;
    }).join("")
    : "<div class=\"small-note\">No hay PDFs guardados.</div>";

  const listEl = document.getElementById("pdfLibraryList");
  const noteEl = document.getElementById("pdfLibraryNote");
  if (noteEl) noteEl.textContent = `PDF recientes: ${list.length}/${PDF_LIBRARY_MAX}`;
  if (listEl) listEl.innerHTML = html;
}

function addPdfToLibrary(entry){
  if (!entry || !entry.dataUrl) return;
  const list = loadPdfLibrary();
  const displayName = entry.reportCode ? String(entry.reportCode) : String(entry.fileName || "PDF");
  const item = {
    id: "pdf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    name: displayName,
    dataUrl: String(entry.dataUrl),
    createdAt: new Date().toISOString()
  };
  list.unshift(item);
  const trimmed = list.slice(0, PDF_LIBRARY_MAX);
  savePdfLibrary(trimmed);
  renderPdfLibrary();
}

async function savePdfOnAndroid(res){
  const Filesystem = window.Capacitor?.Plugins?.Filesystem;
  if (!Filesystem) return false;

  const dataUrl = res?.dataUrl || "";
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
  if (!b64) return false;

  const path = res.fileName || ("reporte_" + Date.now() + ".pdf");

  // Intentar Documents primero, luego Data (no requiere permisos extra)
  for (const directory of ["DOCUMENTS", "DATA"]) {
    try {
      await Filesystem.writeFile({ path, data: b64, directory, recursive: true });
      console.log("PDF guardado en", directory, path);
      return true;
    } catch (e) {
      console.warn("Filesystem.writeFile falló en", directory, ":", e?.message || e);
    }
  }
  return false;
}

function openPdfFromLibrary(id){
  const list = loadPdfLibrary();
  const item = list.find((p) => p.id === id);
  if (!item || !item.dataUrl) return;
  window.open(item.dataUrl, "_blank");
}

function deletePdfFromLibrary(id){
  const list = loadPdfLibrary();
  const next = list.filter((p) => p.id !== id);
  savePdfLibrary(next);
  renderPdfLibrary();
}

function loadTemplateLibrary(){
  try {
    const raw = localStorage.getItem(TEMPLATE_LIBRARY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function saveTemplateLibrary(list){
  localStorage.setItem(TEMPLATE_LIBRARY_KEY, JSON.stringify(list || []));
}

function loadDrafts(){
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

function saveDrafts(list){
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(list || []));
}

function getCurrentDraftId(){
  return localStorage.getItem(CURRENT_DRAFT_ID_KEY) || "";
}

function setCurrentDraftId(id){
  if (id) localStorage.setItem(CURRENT_DRAFT_ID_KEY, id);
  else localStorage.removeItem(CURRENT_DRAFT_ID_KEY);
}

function getDraftSnapshot(){
  return {
    title: document.getElementById('ti_in').value,
    photos: photos.map(p => ({ id: p.id, d: p.d, hRatio: p.hRatio })),
    date: document.getElementById('f_date').value,
    name: (document.getElementById('f_nom').value || ""),
    rank: (document.getElementById('f_rank').value || ""),
    conclusion: document.getElementById('final_conclusion').value
  };
}

function guardarBorrador(){
  const snap = getDraftSnapshot();
  const hasPhotos = Array.isArray(snap.photos) && snap.photos.length > 0;
  const hasTitle = (snap.title || "").trim().length > 0;
  const hasAny = hasPhotos || hasTitle || (snap.name || "").trim() || (snap.rank || "").trim() || (snap.conclusion || "").trim();
  if (!hasAny) {
    alert("No hay información para guardar como borrador.");
    return;
  }

  const list = loadDrafts();
  const currentId = getCurrentDraftId();
  const existingIndex = currentId ? list.findIndex((d) => d.id === currentId) : -1;

  const defaultName = snap.title && String(snap.title).trim()
    ? String(snap.title).trim().slice(0, 40)
    : `Borrador ${new Date().toLocaleString("es-CL")}`;
  const name = String(prompt("Nombre del borrador:", defaultName) || "").trim();
  if (!name) return;

  if (existingIndex === -1 && list.length >= DRAFTS_MAX) {
    alert(`Límite alcanzado: máximo ${DRAFTS_MAX} borradores.`);
    return;
  }

  const payload = {
    id: existingIndex >= 0 ? list[existingIndex].id : ("drf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6)),
    name,
    data: snap,
    createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) list[existingIndex] = payload;
  else list.unshift(payload);

  saveDrafts(list);
  setCurrentDraftId(payload.id);
  renderDrafts();
  alert(existingIndex >= 0 ? "Borrador actualizado." : "Borrador guardado.");
}

function renderDrafts(){
  const listEl = document.getElementById("draftsList");
  const noteEl = document.getElementById("draftsNote");
  if (!listEl) return;

  const list = loadDrafts();
  if (noteEl) noteEl.textContent = `Borradores: ${list.length}/${DRAFTS_MAX}`;

  if (!list.length) {
    listEl.innerHTML = "<div class=\"small-note\">No hay borradores guardados.</div>";
    return;
  }

  listEl.innerHTML = list.map((d) => {
    const date = d?.updatedAt ? new Date(d.updatedAt).toLocaleString("es-CL") : "";
    return `
      <div class="template-item">
        <div class="template-name">${String(d?.name || "BORRADOR")}</div>
        <div class="small-note">${date}</div>
        <div class="grid-actions-2" style="margin-top:6px;">
          <button class="btn-ok btn-mini" onclick="abrirBorrador('${d.id}')">ABRIR</button>
          <button class="btn-sec btn-mini" onclick="eliminarBorrador('${d.id}')">Eliminar</button>
        </div>
      </div>
    `;
  }).join("");
}

async function abrirBorrador(id){
  const list = loadDrafts();
  const d = list.find((x) => x.id === id);
  if (!d?.data) return;
  if (!confirm(`¿Cargar el borrador "${d.name}"?`)) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(d.data));
  setCurrentDraftId(d.id);
  await loadLocal();
  continuarTrabajo();
}

function eliminarBorrador(id){
  const list = loadDrafts();
  const next = list.filter((d) => d.id !== id);
  saveDrafts(next);
  if (getCurrentDraftId() === id) setCurrentDraftId("");
  renderDrafts();
}

function renderTemplateLibrary(){
  const listEl = document.getElementById("templateList");
  const noteEl = document.getElementById("templateLibraryNote");
  if (!listEl) return;

  const list = loadTemplateLibrary();
  if (noteEl) noteEl.textContent = `Plantillas creadas: ${list.length}/${TEMPLATE_LIBRARY_MAX}`;

  if (!list.length) {
    listEl.innerHTML = "<div class=\"small-note\">No hay plantillas guardadas.</div>";
    return;
  }

  const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  listEl.innerHTML = list.map((t) => {
    const name = String(t?.name || "SIN NOMBRE");
    const size = String(t?.size || "").toUpperCase();
    const font = String(t?.font || "").toUpperCase();
    const isActive = (t.id === activeId);
    const actions = [
      `<button class="btn-sec btn-mini" onclick="editTemplate('${t.id}')">EDITAR</button>`,
      ...(isActive ? [] : [`<button class="btn-ok btn-mini" onclick="setActiveTemplate('${t.id}')">USAR</button>`]),
      `<button class="btn-sec btn-mini" onclick="deleteTemplate('${t.id}')">Eliminar</button>`
    ];
    return `
      <div class="template-item">
        <div class="template-name">${name}${size ? " · " + size : ""}${font ? " · " + font : ""}${isActive ? " · ACTIVA" : ""}</div>
        <div class="grid-actions-3" style="margin-top:6px;">
          ${actions.join("")}
        </div>
      </div>
    `;
  }).join("");
}

function getFontFamilyCss(fontId) {
  const f = String(fontId || "").toLowerCase();
  if (f === "times" || f === "garamond" || f === "georgia" || f === "cambria")
    return "'Times New Roman', Times, serif";
  if (f === "courier") return "'Courier New', Courier, monospace";
  if (f === "tahoma") return "Tahoma, Geneva, sans-serif";
  if (f === "verdana") return "Verdana, Geneva, sans-serif";
  return "'Segoe UI', Arial, sans-serif";
}

function renderNewSetMenu(){
  const list = loadTemplateLibrary();
  const btn = document.getElementById("btn-start-template");
  const menu = document.getElementById("newSetTemplates");
  const noteEl = document.getElementById("newSetTemplatesNote");
  const listEl = document.getElementById("newSetTemplatesList");

  if (btn) {
    if (list.length) {
      btn.disabled = false;
      btn.textContent = "PLANTILLAS GUARDADAS";
    } else {
      btn.disabled = true;
      btn.textContent = "NO HAY PLANTILLAS GUARDADAS";
    }
  }

  if (noteEl) noteEl.textContent = `Plantillas creadas: ${list.length}/${TEMPLATE_LIBRARY_MAX}`;
  if (listEl) {
    listEl.innerHTML = list.length
      ? list.map((t) => {
        const name = String(t?.name || "SIN NOMBRE");
        const size = String(t?.size || "").toUpperCase();
        const font = String(t?.font || "").toUpperCase();
        const fontCss = getFontFamilyCss(t?.font || "");
        return `
          <div class="template-item">
            <div class="template-name" style="font-family:${fontCss}">${name}${size ? " · " + size : ""}${font ? " · " + font : ""}</div>
            <div class="grid-actions-2" style="margin-top:6px;">
              <button class="btn-ok btn-mini" onclick="useNewSetTemplate('${t.id}')">USAR</button>
              <button class="btn-sec btn-mini" onclick="deleteTemplate('${t.id}')">Eliminar</button>
            </div>
          </div>
        `;
      }).join("")
      : "<div class=\"small-note\">No hay plantillas guardadas.</div>";
  }

  if (menu && !list.length) menu.classList.remove("open");

}

function openNewSetMenu(){
  renderNewSetMenu();
  cambiarPaso(9);
}

function startNewSetDefault(){
  localStorage.removeItem(ACTIVE_TEMPLATE_KEY);
  cambiarPaso(8);
}

function openNewSetTemplates(){
  const list = loadTemplateLibrary();
  if (!list.length) return;
  const menu = document.getElementById("newSetTemplates");
  if (menu) menu.classList.toggle("open");
  renderNewSetMenu();
}

function useNewSetTemplate(id){
  if (!id) return;
  const list = loadTemplateLibrary();
  const tpl = list.find((t) => t.id === id);
  if (!tpl) return;
  setActiveTemplateSilent(id);
  const menu = document.getElementById("newSetTemplates");
  if (menu) menu.classList.remove("open");
  // Pre-cargar pie de firma desde la plantilla
  if (tpl.signatureName) {
    const el = document.getElementById('f_nom');
    if (el) el.value = tpl.signatureName;
  }
  if (tpl.signatureRank) {
    const el = document.getElementById('f_rank');
    if (el) el.value = tpl.signatureRank;
  }
  saveLocal();
  cambiarPaso(2);
}

function getActiveTemplate(){
  const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  if (!activeId) return null;
  const list = loadTemplateLibrary();
  return list.find((t) => t.id === activeId) || null;
}

function setActiveTemplate(id){
  if (!id) return;
  setActiveTemplateSilent(id);
  alert("Plantilla activada.");
}

function setActiveTemplateSilent(id){
  if (!id) return;
  localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
  renderTemplateLibrary();
  renderNewSetMenu();
}

function getEditingTemplateId(){
  return localStorage.getItem(EDIT_TEMPLATE_ID_KEY) || "";
}

function setEditingTemplateId(id){
  if (id) localStorage.setItem(EDIT_TEMPLATE_ID_KEY, id);
  else localStorage.removeItem(EDIT_TEMPLATE_ID_KEY);
}

function getNewTemplateSize(){
  return localStorage.getItem(NEW_TEMPLATE_SIZE_KEY) || NEW_TEMPLATE_DEFAULT_SIZE;
}

function setNewTemplateSize(value){
  localStorage.setItem(NEW_TEMPLATE_SIZE_KEY, value);
  renderNewTemplateUI();
}

function renderNewTemplateUI(){
  const note = document.getElementById("sheetSizeNote");
  const btnCarta = document.getElementById("sheetCarta");
  const btnOficio = document.getElementById("sheetOficio");
  const btnMexico = document.getElementById("sheetMexico");
  const current = getNewTemplateSize();

  if (note) {
    note.textContent =
      current === "carta" ? "Carta (8.5 x 11)" :
      current === "oficio" ? "Oficio (8.5 x 13)" :
      "Mexico (8.5 x 13.5)";
  }

  if (btnCarta) btnCarta.classList.toggle("active", current === "carta");
  if (btnOficio) btnOficio.classList.toggle("active", current === "oficio");
  if (btnMexico) btnMexico.classList.toggle("active", current === "mexico");

  const font = getTemplateFont();
  const fontNote = document.getElementById("fontNote");
  const btnCalibri = document.getElementById("fontCalibri");
  const btnArial = document.getElementById("fontArial");
  const btnHelvetica = document.getElementById("fontHelvetica");
  const btnTimes = document.getElementById("fontTimes");
  const btnGaramond = document.getElementById("fontGaramond");
  const btnGeorgia = document.getElementById("fontGeorgia");
  const btnCambria = document.getElementById("fontCambria");
  const btnTahoma = document.getElementById("fontTahoma");
  const btnVerdana = document.getElementById("fontVerdana");
  const btnCourier = document.getElementById("fontCourier");

  if (fontNote) fontNote.textContent = `Fuente actual: ${font.toUpperCase()}`;
  if (btnCalibri) btnCalibri.classList.toggle("active", font === "calibri");
  if (btnArial) btnArial.classList.toggle("active", font === "arial");
  if (btnHelvetica) btnHelvetica.classList.toggle("active", font === "helvetica");
  if (btnTimes) btnTimes.classList.toggle("active", font === "times");
  if (btnGaramond) btnGaramond.classList.toggle("active", font === "garamond");
  if (btnGeorgia) btnGeorgia.classList.toggle("active", font === "georgia");
  if (btnCambria) btnCambria.classList.toggle("active", font === "cambria");
  if (btnTahoma) btnTahoma.classList.toggle("active", font === "tahoma");
  if (btnVerdana) btnVerdana.classList.toggle("active", font === "verdana");
  if (btnCourier) btnCourier.classList.toggle("active", font === "courier");

  const marginLeftRange = document.getElementById("marginLeftRange");
  const marginRightRange = document.getElementById("marginRightRange");
  const marginTopRange = document.getElementById("marginTopRange");
  const marginBottomRange = document.getElementById("marginBottomRange");
  const marginLeftNote = document.getElementById("marginLeftNote");
  const marginRightNote = document.getElementById("marginRightNote");
  const marginTopNote = document.getElementById("marginTopNote");
  const marginBottomNote = document.getElementById("marginBottomNote");
  const marginLeft = getMarginSideCm("left");
  const marginRight = getMarginSideCm("right");
  const marginTop = getMarginSideCm("top");
  const marginBottom = getMarginSideCm("bottom");
  if (marginLeftRange) marginLeftRange.value = String(marginLeft);
  if (marginRightRange) marginRightRange.value = String(marginRight);
  if (marginTopRange) marginTopRange.value = String(marginTop);
  if (marginBottomRange) marginBottomRange.value = String(marginBottom);
  if (marginLeftNote) marginLeftNote.textContent = `${marginLeft.toFixed(1)} cm`;
  if (marginRightNote) marginRightNote.textContent = `${marginRight.toFixed(1)} cm`;
  if (marginTopNote) marginTopNote.textContent = `${marginTop.toFixed(1)} cm`;
  if (marginBottomNote) marginBottomNote.textContent = `${marginBottom.toFixed(1)} cm`;

  const noteColor = getNoteColor();
  const noteColorNote = document.getElementById("noteColorNote");
  const btnBlack = document.getElementById("noteColorBlack");
  const btnRed = document.getElementById("noteColorRed");
  const btnBlue = document.getElementById("noteColorBlue");
  const btnGreen = document.getElementById("noteColorGreen");
  if (noteColorNote) noteColorNote.textContent = `Color actual: ${noteColor.toUpperCase()}`;
  if (btnBlack) btnBlack.classList.toggle("active", noteColor === "black");
  if (btnRed) btnRed.classList.toggle("active", noteColor === "red");
  if (btnBlue) btnBlue.classList.toggle("active", noteColor === "blue");
  if (btnGreen) btnGreen.classList.toggle("active", noteColor === "green");

  const mode = getMembreteMode();
  const textWrap = document.getElementById("membreteTextFields");
  const imageWrap = document.getElementById("membreteImageFields");
  const btnText = document.getElementById("membreteTextBtn");
  const btnImage = document.getElementById("membreteImageBtn");

  if (btnText) btnText.classList.toggle("active", mode === "text");
  if (btnImage) btnImage.classList.toggle("active", mode === "image");
  if (textWrap) textWrap.classList.toggle("open", mode === "text");
  if (imageWrap) imageWrap.classList.toggle("open", mode === "image");

  const lines = getMembreteTextLines();
  const l1 = document.getElementById("membreteLine1");
  const l2 = document.getElementById("membreteLine2");
  const l3 = document.getElementById("membreteLine3");
  if (l1 && l1.value !== (lines[0] || "")) l1.value = lines[0] || "";
  if (l2 && l2.value !== (lines[1] || "")) l2.value = lines[1] || "";
  if (l3 && l3.value !== (lines[2] || "")) l3.value = lines[2] || "";

  const preview = document.getElementById("membretePreview");
  const imgData = getMembreteImage();
  if (preview) {
    if (imgData) {
      preview.src = imgData;
      preview.style.display = "block";
    } else {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }
  }

  const sigNameEl = document.getElementById("templateSigName");
  const sigRankEl = document.getElementById("templateSigRank");
  if (sigNameEl && sigNameEl.value !== getTemplateSigName()) sigNameEl.value = getTemplateSigName();
  if (sigRankEl && sigRankEl.value !== getTemplateSigRank()) sigRankEl.value = getTemplateSigRank();
  renderTemplateSigImageUI();
}

function editTemplate(id){
  if (!id) return;
  const list = loadTemplateLibrary();
  const tpl = list.find((t) => t.id === id);
  if (!tpl) return;

  setNewTemplateSize(tpl.size || NEW_TEMPLATE_DEFAULT_SIZE);
  setTemplateFont(tpl.font || NEW_TEMPLATE_DEFAULT_FONT);
  setMarginSideCm("left", tpl?.margins?.leftCm ?? NEW_TEMPLATE_DEFAULT_MARGIN_SIDE);
  setMarginSideCm("right", tpl?.margins?.rightCm ?? NEW_TEMPLATE_DEFAULT_MARGIN_SIDE);
  setMarginSideCm("top", tpl?.margins?.topCm ?? NEW_TEMPLATE_DEFAULT_MARGIN_SIDE);
  setMarginSideCm("bottom", tpl?.margins?.bottomCm ?? NEW_TEMPLATE_DEFAULT_MARGIN_SIDE);
  setNoteColor(tpl.noteColor || NEW_TEMPLATE_DEFAULT_NOTE_COLOR);
  setMembreteMode(tpl?.membrete?.mode || "text");
  setMembreteTextLines(tpl?.membrete?.textLines || ["", "", ""]);
  setMembreteImage(tpl?.membrete?.imageDataUrl || "");
  setTemplateSigName(tpl.signatureName || "");
  setTemplateSigRank(tpl.signatureRank || "");
  setTemplateSigImage(tpl.signatureImageDataUrl || "");
  setEditingTemplateId(tpl.id);

  const input = document.getElementById("newTemplateName");
  if (input) input.value = tpl.name || "";
  renderNewTemplateUI();
  cambiarPaso(7);
}

function toggleSheetSizeMenu(){
  closeSubmenu("marginsMenu");
  closeSubmenu("membreteMenu");
  const menu = document.getElementById("sheetSizeMenu");
  if (menu) menu.classList.toggle("open");
}

function selectSheetSize(value){
  setNewTemplateSize(value);
  closeSubmenu("sheetSizeMenu");
}

function getTemplateFont(){
  return localStorage.getItem(NEW_TEMPLATE_FONT_KEY) || NEW_TEMPLATE_DEFAULT_FONT;
}

function setTemplateFont(value){
  localStorage.setItem(NEW_TEMPLATE_FONT_KEY, value);
  renderNewTemplateUI();
}

function toggleFontMenu(){
  closeSubmenu("marginsMenu");
  closeSubmenu("membreteMenu");
  const menu = document.getElementById("fontMenu");
  if (menu) menu.classList.toggle("open");
  renderNewTemplateUI();
}

function selectTemplateFont(value){
  setTemplateFont(value);
  closeSubmenu("fontMenu");
}

function getMarginSideCm(side){
  let key = NEW_TEMPLATE_MARGIN_LEFT_KEY;
  if (side === "right") key = NEW_TEMPLATE_MARGIN_RIGHT_KEY;
  if (side === "top") key = NEW_TEMPLATE_MARGIN_TOP_KEY;
  if (side === "bottom") key = NEW_TEMPLATE_MARGIN_BOTTOM_KEY;
  const raw = localStorage.getItem(key);
  const num = Number(raw);
  if (!Number.isFinite(num)) return NEW_TEMPLATE_DEFAULT_MARGIN_SIDE;
  return Math.min(3.5, Math.max(0.5, num));
}

function setMarginSideCm(side, value){
  const num = Number(value);
  if (!Number.isFinite(num)) return;
  const clamped = Math.min(3.5, Math.max(0.5, num));
  let key = NEW_TEMPLATE_MARGIN_LEFT_KEY;
  if (side === "right") key = NEW_TEMPLATE_MARGIN_RIGHT_KEY;
  if (side === "top") key = NEW_TEMPLATE_MARGIN_TOP_KEY;
  if (side === "bottom") key = NEW_TEMPLATE_MARGIN_BOTTOM_KEY;
  localStorage.setItem(key, String(clamped));
  renderNewTemplateUI();
}

function toggleMarginsMenu(){
  closeSubmenu("membreteMenu");
  const menu = document.getElementById("marginsMenu");
  if (menu) menu.classList.toggle("open");
  renderNewTemplateUI();
}

function updateMarginSide(side, value){
  setMarginSideCm(side, value);
}

function closeSubmenu(id){
  const menu = document.getElementById(id);
  if (menu) menu.classList.remove("open");
}

function getNoteColor(){
  return localStorage.getItem(NEW_TEMPLATE_NOTE_COLOR_KEY) || NEW_TEMPLATE_DEFAULT_NOTE_COLOR;
}

function setNoteColor(value){
  localStorage.setItem(NEW_TEMPLATE_NOTE_COLOR_KEY, value);
  renderNewTemplateUI();
}

function toggleNoteColorMenu(){
  closeSubmenu("marginsMenu");
  closeSubmenu("membreteMenu");
  const menu = document.getElementById("noteColorMenu");
  if (menu) menu.classList.toggle("open");
  renderNewTemplateUI();
}

function selectNoteColor(value){
  setNoteColor(value);
  closeSubmenu("noteColorMenu");
}

function getTemplateSigName(){
  return localStorage.getItem(NEW_TEMPLATE_SIGNATURE_NAME_KEY) || "";
}
function setTemplateSigName(value){
  localStorage.setItem(NEW_TEMPLATE_SIGNATURE_NAME_KEY, value || "");
}
function getTemplateSigRank(){
  return localStorage.getItem(NEW_TEMPLATE_SIGNATURE_RANK_KEY) || "";
}
function setTemplateSigRank(value){
  localStorage.setItem(NEW_TEMPLATE_SIGNATURE_RANK_KEY, value || "");
}

function getMembreteMode(){
  return localStorage.getItem(NEW_TEMPLATE_MEMBRETE_MODE_KEY) || "text";
}

function setMembreteMode(value){
  localStorage.setItem(NEW_TEMPLATE_MEMBRETE_MODE_KEY, value);
  renderNewTemplateUI();
}

function getMembreteTextLines(){
  try {
    const raw = localStorage.getItem(NEW_TEMPLATE_MEMBRETE_TEXT_KEY);
    const lines = raw ? JSON.parse(raw) : ["", "", ""];
    return Array.isArray(lines) ? lines : ["", "", ""];
  } catch (_) {
    return ["", "", ""];
  }
}

function setMembreteTextLines(lines){
  localStorage.setItem(NEW_TEMPLATE_MEMBRETE_TEXT_KEY, JSON.stringify(lines || ["", "", ""]));
}

function getMembreteImage(){
  return localStorage.getItem(NEW_TEMPLATE_MEMBRETE_IMAGE_KEY) || "";
}

function setMembreteImage(dataUrl){
  if (dataUrl) localStorage.setItem(NEW_TEMPLATE_MEMBRETE_IMAGE_KEY, dataUrl);
  else localStorage.removeItem(NEW_TEMPLATE_MEMBRETE_IMAGE_KEY);
}

function toggleMembreteMenu(){
  closeSubmenu("marginsMenu");
  const menu = document.getElementById("membreteMenu");
  if (menu) menu.classList.toggle("open");
  renderNewTemplateUI();
}

function selectMembreteMode(value){
  setMembreteMode(value);
  closeSubmenu("membreteMenu");
}

function updateMembreteText(){
  const l1 = document.getElementById("membreteLine1");
  const l2 = document.getElementById("membreteLine2");
  const l3 = document.getElementById("membreteLine3");
  setMembreteTextLines([
    (l1?.value || "").trim(),
    (l2?.value || "").trim(),
    (l3?.value || "").trim()
  ]);
}

async function handleMembreteImage(file){
  if (!file) {
    setMembreteImage("");
    renderNewTemplateUI();
    return;
  }
  try{
    const dataUrl = await fileToJpegDataUrl(file, 800);
    setMembreteImage(String(dataUrl || ""));
    renderNewTemplateUI();
    closeSubmenu("membreteMenu");
  } catch (e) {
    alert("No se pudo cargar la imagen del membrete.");
  }
}

function openMembreteImagePicker(){
  const input = document.getElementById("membreteImageInput");
  if (input) input.click();
}

function saveNewTemplate(){
  const list = loadTemplateLibrary();
  const editingId = getEditingTemplateId();
  const editingIndex = editingId ? list.findIndex((t) => t.id === editingId) : -1;
  if (editingIndex === -1 && list.length >= TEMPLATE_LIBRARY_MAX) {
    alert(`Límite alcanzado: máximo ${TEMPLATE_LIBRARY_MAX} plantillas.`);
    return;
  }

  const input = document.getElementById("newTemplateName");
  const name = String(input?.value || "").trim();
  if (!name) {
    alert("Ingresa un nombre para la plantilla.");
    return;
  }

  const payload = {
    id: editingIndex >= 0 ? list[editingIndex].id : "tpl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    name,
    size: getNewTemplateSize(),
    font: getTemplateFont(),
    margins: {
      leftCm: getMarginSideCm("left"),
      rightCm: getMarginSideCm("right"),
      topCm: getMarginSideCm("top"),
      bottomCm: getMarginSideCm("bottom")
    },
    noteColor: getNoteColor(),
    membrete: {
      mode: getMembreteMode(),
      textLines: getMembreteTextLines(),
      imageDataUrl: getMembreteImage()
    },
    signatureName: getTemplateSigName(),
    signatureRank: getTemplateSigRank(),
    signatureImageDataUrl: getTemplateSigImage(),
    createdAt: editingIndex >= 0 ? list[editingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editingIndex >= 0) {
    list[editingIndex] = payload;
  } else {
    list.push(payload);
  }

  saveTemplateLibrary(list);
  setActiveTemplate(payload.id);
  setEditingTemplateId("");
  if (input) input.value = "";
  renderTemplateLibrary();
  renderNewSetMenu();
  alert(editingIndex >= 0 ? "Plantilla actualizada." : "Plantilla guardada en la biblioteca.");
  cambiarPaso(1);
}

function deleteTemplate(id){
  const list = loadTemplateLibrary();
  const next = list.filter((t) => t.id !== id);
  saveTemplateLibrary(next);
  renderTemplateLibrary();
  renderNewSetMenu();
}

/***********************
 * STORAGE / DB
 ***********************/
const STORAGE_KEY = 'set_foto_v19';
const FINALIZED_FLAG = 'set_foto_v19_finalized';

const DB_NAME = 'set_foto_db_v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';

/***********************
 * WEATHER / UTM
 ***********************/
const WEATHER_CITY_KEY = "set_weather_city_v1";
const DEFAULT_CITY = { name: "Osorno", lat: -40.573, lon: -73.133 };
const UTM_URL = "https://mindicador.cl/api/utm";
const JPL_BASE_IS_SECOND = true;

/***********************
 * STATE
 ***********************/
let photos = [];
let __isGeneratingPdf = false;
let __stepHistory = [];
let __currentStep = 1;
// Cache base64 para PDF (evita reconvertir blobs grandes y reduce fallas en APK)
const photoDataUrlCache = new Map(); // id -> "data:image/jpeg;base64,..."
let preview = { blob: null, url: null };
window.lastPdfObjectUrl = null; // usado por pdf-logic

function skipSplashWords(){
  const splashWords = document.getElementById("splash-words");
  if (splashWords) splashWords.classList.add("hidden");
  document.body.classList.add("app-ready");
}

function togglePanel(contentId, arrowId){
  const content = document.getElementById(contentId);
  const arrow = document.getElementById(arrowId);
  if (!content) return;
  const isOpen = content.style.display !== "none" && content.style.display !== "";
  content.style.display = isOpen ? "none" : "block";
  if (arrow) arrow.textContent = isOpen ? "▼" : "▲";
}

function uuid(){ return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9); }
function revokeAllUrls(){ photos.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); }); }

function initModoEscritorio(){
  const isNative = window.Capacitor?.isNativePlatform?.() === true;
  if (!isNative) {
    const btn = document.getElementById('btnModoEscritorio');
    if (btn) btn.style.display = 'block';
  }
}

function toggleModoEscritorio(){
  const isDesktop = document.body.classList.toggle('modo-escritorio');
  const btn = document.getElementById('btnModoEscritorio');
  if (btn) btn.textContent = isDesktop ? '📱 CAMBIAR A VERSIÓN MÓVIL' : '🖥️ CAMBIAR A VERSIÓN WEB';
}

function setFooter(){
  document.getElementById("footerText").innerHTML =
    `CREADA POR HERNAN DIAZ DINAMARCA<br>${VERSION_LABEL} BUILD ${BUILD_DATE}<br>FUNCIONANDO HASTA EL 20.05.2026`;
}

/***********************
 * THEME
 ***********************/
const THEME_KEY = "set_theme_dark_v1";
function applyTheme(isDark){
  document.body.classList.toggle("dark", !!isDark);
  localStorage.setItem(THEME_KEY, isDark ? "1" : "0");
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.textContent = isDark ? "TEMA OSCURO: ON" : "TEMA OSCURO: OFF";
}
function toggleTheme(){
  applyTheme(!document.body.classList.contains("dark"));
}
function initTheme(){
  applyTheme(localStorage.getItem(THEME_KEY) === "1");
}

/***********************
 * INDEXEDDB
 ***********************/
function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
    };

    req.onblocked = () => {
      console.warn("IndexedDB blocked: cierre otras pestañas/instancias de la app.");
      // no rechazamos: dejamos que el usuario siga, pero puede fallar hasta liberar bloqueo
    };

    req.onsuccess = () => {
      const db = req.result;

      // ✅ Si otra instancia pide upgrade, cerramos esta para evitar bloqueos
      db.onversionchange = () => {
        try { db.close(); } catch(_) {}
      };

      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}
async function idbPutPhoto(id, blob){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).put({ id, blob });
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function idbGetPhoto(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const req = tx.objectStore(STORE_PHOTOS).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result ? req.result.blob : null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
async function idbDeletePhoto(id){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).delete(id);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function idbClearAll(){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).clear();
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/***********************
 * PREVIEW / IMAGE
 ***********************/
function clearPreview(){
  if (preview.url) URL.revokeObjectURL(preview.url);
  preview = { blob: null, url: null };
  const img = document.getElementById('previewImg');
  img.style.display = 'none';
  img.src = '';
  document.getElementById('btn-rotL').disabled = true;
  document.getElementById('btn-rotR').disabled = true;
}
function showPreviewFromBlob(blob){
  clearPreview();
  preview.blob = blob;
  preview.url = URL.createObjectURL(blob);
  const img = document.getElementById('previewImg');
  img.src = preview.url;
  img.style.display = 'block';
  document.getElementById('btn-rotL').disabled = false;
  document.getElementById('btn-rotR').disabled = false;
}
function blobToDataURL(blob){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function blobToDataURLStable(blob){
  // Metodo 1: FileReader (rapido)
  try{
    const d1 = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    if (typeof d1 === "string" && d1.startsWith("data:image/")) return d1;
  }catch(e){
    // sigue al metodo 2
  }

  // Metodo 2: Canvas (mas estable en algunos WebView)
  const url = URL.createObjectURL(blob);
  try{
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // siempre JPEG para jsPDF
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ✅ Optimización automática
function getCompressionSettings(file){
  const sizeMB = (file.size || 0) / (1024 * 1024);
  let maxSide = 1600;
  let quality = 0.72;

  if (sizeMB > 20) { maxSide = 1100; quality = 0.55; }
  else if (sizeMB > 12) { maxSide = 1300; quality = 0.60; }
  else if (sizeMB > 8) { maxSide = 1400; quality = 0.65; }
  else if (sizeMB > 4) { maxSide = 1500; quality = 0.68; }

  return { maxSide, quality };
}

function isUnsupportedImageType(file){
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return type.includes("heic") || type.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif");
}

async function optimizeImageFileToBlob(file){
  const t = (file.type || "").toLowerCase();
  if (t.includes("heic") || t.includes("heif")) {
    throw new Error("Formato HEIC/HEIF no soportado. Cambia la cámara a JPEG o usa 'Compartir como JPG'.");
  }

  const { maxSide, quality } = getCompressionSettings(file);

  let bmp;
  let useResizedBitmap = false;
  try {
    // Intentar decodificar ya redimensionado para ahorrar memoria (si el navegador soporta).
    bmp = await createImageBitmap(file, { resizeWidth: maxSide, resizeQuality: "medium" });
    useResizedBitmap = true;
  } catch (e) {
    try {
      bmp = await createImageBitmap(file);
    } catch (_) {
      throw new Error("No se pudo decodificar la imagen (posible HDR/HEIC o memoria).");
    }
  }

  const w0 = bmp.width, h0 = bmp.height;
  const maxDim = Math.max(w0, h0);
  const scale = maxDim > maxSide ? (maxSide / maxDim) : 1;
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);

  try { bmp.close(); } catch (_) {}

  const outBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
  canvas.width = 0; canvas.height = 0;

  if (!outBlob) {
    throw new Error("No se pudo convertir a JPG (memoria insuficiente o formato HDR).");
  }

  return outBlob;
}

/***********************
 * BOOT
 ***********************/
window.onload = () => {
  setFooter();
  initTheme();
  initModoEscritorio();

  const splash = document.getElementById('splash');         // Skin 1
  const splashWords = document.getElementById('splash-words'); // Skin 2

  // ✅ Regla:
  // - Primer arranque en esta sesión: Skin 1 + Skin 2
  // - Si el usuario recarga/actualiza: solo Skin 1
  const skipSkin2 = sessionStorage.getItem("skip_skin2_once") === "1";

  // Duración Skin 1 (seg)
  const splashDuration = 4000;

  // Duración Skin 2 (seg) (solo si no lo saltamos)
  const splashWordsDuration = 8000;

  // Siempre mostrar Skin 1 al cargar
  if (splash) splash.classList.remove('hidden');
  if (splashWords) splashWords.classList.add('hidden');

  // Después del Skin 1:
  setTimeout(() => {
    if (splash) splash.classList.add('hidden');

    if (checkExpiry()) return;

    if (!skipSkin2) {
      // Mostrar Skin 2 solo en primer arranque de la sesión
      if (splashWords) splashWords.classList.remove('hidden');

      setTimeout(() => {
        if (splashWords) splashWords.classList.add('hidden');
        if (!checkExpiry()) document.body.classList.add('app-ready');
      }, splashWordsDuration);
    } else {
      // Saltar Skin 2
      document.body.classList.add('app-ready');
    }
  }, splashDuration);

  // ✅ Desde ahora en esta sesión, cualquier recarga omitirá Skin 2
  // (si cierras la app, se borra y vuelve a mostrarse)
  sessionStorage.setItem("skip_skin2_once", "1");

  arrancarSeguridadYMenu();
};

async function arrancarSeguridadYMenu(){
  const finalized = localStorage.getItem(FINALIZED_FLAG);

  if (finalized === '1') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FINALIZED_FLAG);

    revokeAllUrls();
    photos = [];
    await idbClearAll();

    document.getElementById('ti_in').value = "";
    document.getElementById('f_date').value = (() => { const _n = new Date(); return `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`; })();
    document.getElementById('f_nom').value = "";
    document.getElementById('f_rank').value = "";
    document.getElementById('final_conclusion').value = "";

    document.getElementById('finalized-msg').style.display = 'block';
  } else {
    document.getElementById('finalized-msg').style.display = 'none';
  }

  await loadLocal();
  actualizarMenuPrincipal();

  if (document.getElementById("jplValue")) {
    updateJPL();
  }
  await initWeather();
  if (document.getElementById("utmValue")) {
    await refreshUTM();
  }
}

/***********************
 * MENU / NAV
 ***********************/
function actualizarMenuPrincipal(){
  const saved = localStorage.getItem(STORAGE_KEY);
  let hasWork = false;

  if (saved) {
    try {
      const data = JSON.parse(saved);
      const titleOk = (data.title || "").trim().length > 0;
      const photosOk = Array.isArray(data.photos) && data.photos.length > 0;
      const anyFieldOk = ((data.name||"").trim() || (data.rank||"").trim() || (data.conclusion||"").trim());
      hasWork = titleOk || photosOk || anyFieldOk;
    } catch (e) { hasWork = false; }
  }

  document.getElementById('btn-continuar').style.display = hasWork ? 'block' : 'none';
  document.getElementById('recovery-msg').style.display = hasWork ? 'block' : 'none';
}

function continuarTrabajo(){
  const status = document.getElementById('status');
  if (status) status.innerText = "";

  const title = (document.getElementById('ti_in').value || "").trim();
  const hasPhotos = Array.isArray(photos) && photos.length > 0;

  const hasClosingData =
    (document.getElementById('f_date').value || "").trim() ||
    (document.getElementById('f_nom').value || "").trim() ||
    (document.getElementById('f_rank').value || "").trim() ||
    (document.getElementById('final_conclusion').value || "").trim();

  // Resetear historial al continuar: "volver atrás" desde cualquier pantalla lleva al menú
  __stepHistory = [1];

  if (hasPhotos && hasClosingData) {
    cambiarPaso(5);
  } else if (hasPhotos) {
    cambiarPaso(4);
  } else if (title) {
    cambiarPaso(3);
  } else {
    cambiarPaso(2);
  }
}

async function nuevoInforme(){
  if (confirm("¿Comenzar un informe NUEVO? Esto borrará el trabajo guardado.")) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FINALIZED_FLAG);

    revokeAllUrls();
    photos = [];
    photoDataUrlCache.clear();
    await idbClearAll();
    clearPreview();

    document.getElementById('ti_in').value = "";
    document.getElementById('f_date').value = (() => { const _n = new Date(); return `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`; })();
    document.getElementById('f_nom').value = "";
    document.getElementById('f_rank').value = "";
    document.getElementById('final_conclusion').value = "";

    actualizarMenuPrincipal();
    setReportMembreteEnabled(true);
    openNewSetMenu();
  }
}

function volverAtras(){
  const prev = __stepHistory.pop();
  cambiarPasoInterno(prev !== undefined ? prev : 1);
}

function cambiarPaso(n, addToHistory = true){
  if (addToHistory && __currentStep !== n) {
    __stepHistory.push(__currentStep);
    if (__stepHistory.length > 15) __stepHistory.shift();
  }
  if (n === 1) __stepHistory = [];
  __currentStep = n;
  cambiarPasoInterno(n);
}

function cambiarPasoInterno(n){
  // ✅ Si sales del paso 3 (carga), limpia preview para no dejar blobs/urls vivos
  const wasStep3 = document.getElementById('s3')?.classList.contains('active');
  if (wasStep3 && n !== 3) {
    clearPreview();
  }

  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('s' + n).classList.add('active');

  if (n === 3) {
    document.getElementById('lbl_f').innerText = "FOTOGRAFÍA " + (photos.length + 1).toString().padStart(2, '0');
    const status = document.getElementById('status');
    if (status) status.innerText = `${photos.length} foto${photos.length !== 1 ? "s" : ""} cargada${photos.length !== 1 ? "s" : ""}`;
    document.getElementById('btn-add').disabled = false;
    document.getElementById('f_input').disabled = false;
  } else if (n === 5) {
    renderReportNoteColorUI();
    applyNoteTextareaColor();
  }

  if (n === 5) {
    document.getElementById('ti_in_review').value = document.getElementById('ti_in').value || "";
    dibujarRevision();
    updatePdfButtonState();
  }

  if (n === 4) {
    renderSigImageUI();
  }

  if (n === 7) {
    renderNewTemplateUI();
  }

  if (n === 8) {
    renderReportMembreteUI();
  }

  document.querySelector('.content').scrollTo(0,0);
  if (n === 1) {
    actualizarMenuPrincipal();
  }
}

function guardarTitulo(){
  if (!document.getElementById('ti_in').value.trim()) return alert("Por favor ingrese un título.");
  saveLocal();
  cambiarPaso(3);
}

function actualizarTituloDesdeRevision(val){
  document.getElementById('ti_in').value = val;
  saveLocal();
}

/***********************
 * SAVE / LOAD
 ***********************/
function saveLocal(){
  const data = {
    title: document.getElementById('ti_in').value,
    photos: photos.map(p => ({ id: p.id, d: p.d, hRatio: p.hRatio })),
    date: document.getElementById('f_date').value,
    name: (document.getElementById('f_nom').value || ""),
    rank: document.getElementById('f_rank').value,
    conclusion: document.getElementById('final_conclusion').value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  actualizarMenuPrincipal();
  updatePdfButtonState();
}

async function loadLocal(){
  const saved = localStorage.getItem(STORAGE_KEY);
  revokeAllUrls();
  photos = [];

  if (saved) {
    const data = JSON.parse(saved);
    document.getElementById('ti_in').value = data.title || "";
    document.getElementById('f_date').value = data.date || (() => { const _n = new Date(); return `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`; })();
    document.getElementById('f_nom').value = data.name || "";
    document.getElementById('f_rank').value = data.rank || "";
    document.getElementById('final_conclusion').value = data.conclusion || "";

    const meta = Array.isArray(data.photos) ? data.photos : [];
    for (const m of meta) {
      const blob = await idbGetPhoto(m.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        photos.push({ id: m.id, url, d: m.d || "", hRatio: Number(m.hRatio) || 1 });
      }
    }
  } else {
    document.getElementById('f_date').value = (() => { const _n = new Date(); return `${_n.getFullYear()}-${String(_n.getMonth()+1).padStart(2,'0')}-${String(_n.getDate()).padStart(2,'0')}`; })();
  }
  updatePdfButtonState();
}

async function borrarTodo(){
  if (confirm("¿Estás seguro de borrar todo? No se podrá recuperar.")) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FINALIZED_FLAG);

    revokeAllUrls();
    photos = [];
    photoDataUrlCache.clear();
    await idbClearAll();
    clearPreview();
    setReportSigImage("");

    location.reload();
  }
}

/***********************
 * PHOTO FLOW
 ***********************/
async function previsualizar(inputEl){
  const input = inputEl || document.getElementById('f_input');
  if (!(input.files && input.files[0])) {
    document.getElementById('status').innerText = "";
    clearPreview();
    return;
  }

  const file = input.files[0];
  document.getElementById('status').innerText = "Procesando imagen...";

  // Mostrar foto cruda inmediatamente mientras se comprime en background
  const rawUrl = URL.createObjectURL(file);
  const imgEl = document.getElementById('previewImg');
  if (imgEl) { imgEl.src = rawUrl; imgEl.style.display = 'block'; }

  try {
    const outBlob = await optimizeImageFileToBlob(file);
    URL.revokeObjectURL(rawUrl);
    showPreviewFromBlob(outBlob);
    document.getElementById('status').innerText = "Imagen seleccionada: " + file.name;
  } catch (e) {
    URL.revokeObjectURL(rawUrl);
    console.error(e);
    const msg = (e && e.message) ? e.message : "Error al preparar la imagen. Intente con otra foto o una captura de pantalla.";
    alert(msg);
    clearPreview();
  }
}

async function rotarPreview(dir){
  try {
    if (!preview.blob) return;

    const url = URL.createObjectURL(preview.blob);
    const img = new Image();

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        canvas.width = img.height;
        canvas.height = img.width;

        if (dir === 'R') { ctx.translate(canvas.width, 0); ctx.rotate(Math.PI/2); }
        else { ctx.translate(0, canvas.height); ctx.rotate(-Math.PI/2); }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img, 0, 0);

        const outBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.78);
        });

        showPreviewFromBlob(outBlob);

      } catch (err) {
        console.error(err);
        alert("No se pudo rotar la vista previa.");
      } finally { URL.revokeObjectURL(url); }
    };

    img.onerror = () => { URL.revokeObjectURL(url); alert("No se pudo cargar la imagen para rotar."); };
    img.src = url;

  } catch (e) {
    console.error(e);
    alert("Error al rotar la vista previa.");
  }
}

async function procesarFoto(){
  const input = document.getElementById('f_input');
  if (!preview.blob) return alert("Debe seleccionar una foto primero (y ver la miniatura).");

  document.getElementById('btn-add').disabled = true;
  document.getElementById('status').innerText = "Guardando imagen...";

  try {
    const outBlob = preview.blob;
    const id = uuid();
    await idbPutPhoto(id, outBlob);

    // Pre-calcula base64 para PDF y lo deja cacheado (reduce fallas en APK)
    try{
      const dataUrl = await blobToDataURLStable(outBlob);
      photoDataUrlCache.set(id, dataUrl);
    }catch(_){}

    const previewUrl = URL.createObjectURL(outBlob);

    const tmpUrl = URL.createObjectURL(outBlob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
      img.src = tmpUrl;
    });
    const hRatio = img.height / img.width;
    URL.revokeObjectURL(tmpUrl);

    photos.push({ id, url: previewUrl, d: document.getElementById('f_txt').value, hRatio });

    input.value = "";
    document.getElementById('f_txt').value = "";
    clearPreview();

    document.getElementById('btn-add').disabled = false;
    document.getElementById('status').innerText = "¡Guardada correctamente!";
    saveLocal();
    setTimeout(() => { cambiarPaso(3); }, 250);

  } catch(e) {
    console.error(e);
    alert("Error al guardar la foto.");
    document.getElementById('btn-add').disabled = false;
    document.getElementById('status').innerText = "";
  }
}

let _pendingDeleteIndex = null;

function eliminarFoto(index){
  _pendingDeleteIndex = index;
  document.getElementById('deletePhotoModal').style.display = 'flex';
}

function cerrarModalEliminar(){
  _pendingDeleteIndex = null;
  document.getElementById('deletePhotoModal').style.display = 'none';
}

async function confirmarEliminarFoto(){
  cerrarModalEliminar();
  const index = _pendingDeleteIndex;
  if (index === null) return;
  const p = photos[index];
  if (p?.id) photoDataUrlCache.delete(p.id);
  if (p?.url) URL.revokeObjectURL(p.url);
  photos.splice(index, 1);
  saveLocal();
  dibujarRevision();
  if (p?.id) { try { await idbDeletePhoto(p.id); } catch(_) {} }
}

function actualizarDesc(index, val){
  photos[index].d = val;
  saveLocal();
  updatePdfButtonState();
}

function moverFoto(index, dir){
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= photos.length) return;
  const tmp = photos[index];
  photos[index] = photos[newIndex];
  photos[newIndex] = tmp;
  saveLocal();
  dibujarRevision();
  updatePdfButtonState();
}

async function rotarFoto(index, dir){
  try {
    const p = photos[index];
    if (!p) return;

    const blob = await idbGetPhoto(p.id);
    if (!blob) return alert("No se encontró la imagen en la base local.");

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        canvas.width = img.height;
        canvas.height = img.width;

        if (dir === 'R') { ctx.translate(canvas.width, 0); ctx.rotate(Math.PI/2); }
        else { ctx.translate(0, canvas.height); ctx.rotate(-Math.PI/2); }

        ctx.fillStyle="#ffffff";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img, 0, 0);

        const outBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8);
        });

        await idbPutPhoto(p.id, outBlob);

        // Actualiza cache base64 (si estas usando el parche #2)
        try{
          const dataUrl = await blobToDataURLStable(outBlob);
          photoDataUrlCache.set(p.id, dataUrl);
        }catch(_){}

        if (p.url) URL.revokeObjectURL(p.url);
        p.url = URL.createObjectURL(outBlob);

        // ✅ recalcula hRatio leyendo dimensiones reales del blob final
        const tmpUrl2 = URL.createObjectURL(outBlob);
        try{
          const img2 = new Image();
          await new Promise((resolve, reject) => {
            img2.onload = () => resolve(true);
            img2.onerror = reject;
            img2.src = tmpUrl2;
          });
          p.hRatio = (img2.height / img2.width);
        } finally {
          URL.revokeObjectURL(tmpUrl2);
        }

        saveLocal();
        dibujarRevision();

      } catch (err) {
        console.error(err);
        alert("No se pudo rotar la foto.");
      } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert("No se pudo cargar la imagen para rotar."); };
    img.src = url;

  } catch (e) {
    console.error(e);
    alert("Error al rotar la foto.");
  }
}

function dibujarRevision(){
  const area = document.getElementById('render_area');
  area.innerHTML = "";

  const counter = document.createElement("div");
  counter.style.textAlign = "center";
  counter.style.fontWeight = "900";
  counter.style.margin = "8px 0 12px";
  counter.style.color = "var(--muted)";
  counter.textContent = `${photos.length} foto${photos.length !== 1 ? "s" : ""}`;

  area.appendChild(counter);

  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.style.textAlign = 'center';
    empty.textContent = "No hay fotos cargadas.";
    area.appendChild(empty);
  }

  photos.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'item-foto';

    const upDisabled = (i === 0) ? 'disabled' : '';
    const downDisabled = (i === photos.length - 1) ? 'disabled' : '';

    div.innerHTML = `
      <div class="item-header">
        <span>FOTO ${(i+1).toString().padStart(2, '0')}</span>
        <span class="btn-delete" onclick="eliminarFoto(${i})">ELIMINAR ✕</span>
      </div>

      <img src="" style="width:100%; border-radius:10px; border:1px solid #ddd; margin-bottom:6px;">

      <textarea placeholder="Descripción..." onchange="actualizarDesc(${i}, this.value)">${p.d || ""}</textarea>

      <div class="grid-actions-4">
        <button class="btn-edit btn-mini" onclick="rotarFoto(${i}, 'L')">GIRAR 90° IZQ</button>
        <button class="btn-edit btn-mini" onclick="rotarFoto(${i}, 'R')">GIRAR 90° DER</button>
        <button class="btn-main btn-mini" ${upDisabled} onclick="moverFoto(${i}, -1)">SUBIR</button>
        <button class="btn-main btn-mini" ${downDisabled} onclick="moverFoto(${i}, 1)">BAJAR</button>
      </div>
    `;
    area.appendChild(div);
    const img = div.querySelector("img");
    setReviewImage(img, p);
  });

  updatePdfButtonState();
}

async function setReviewImage(img, p){
  if (!img || !p) return;
  const cached = p.id ? photoDataUrlCache.get(p.id) : null;
  if (cached) {
    img.src = cached;
    return;
  }
  if (p.url) img.src = p.url;
  try{
    if (!p.id) return;
    const blob = await idbGetPhoto(p.id);
    if (!blob) return;
    const dataUrl = await blobToDataURLStable(blob);
    photoDataUrlCache.set(p.id, dataUrl);
    img.src = dataUrl;
  }catch(e){
    console.warn("No se pudo cargar miniatura:", e);
  }
}

/***********************
 * PDF CONTROL
 ***********************/
function formatDateLongEs(iso){
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });
}

function setFinalizedFlag(){
  localStorage.setItem(FINALIZED_FLAG, "1");
}

function updatePdfButtonState(){
  const btn = document.getElementById('btn-pdf');
  if (!btn) return;

  const titleOk = (document.getElementById('ti_in').value || "").trim().length > 0;
  const photosOk = Array.isArray(photos) && photos.length > 0;

  // Recomendado: exigir cierre minimo
  const dateOk = (document.getElementById('f_date').value || "").trim().length > 0;
  const nameOk = (document.getElementById('f_nom').value || "").trim().length > 0;
  const rankOk = (document.getElementById('f_rank').value || "").trim().length > 0;

  const can = titleOk && photosOk && dateOk && nameOk && rankOk;

  btn.disabled = !can;
  btn.title = can ? "" : "Completa titulo, fotos y datos de cierre (fecha, nombre, cargo).";
}

async function generarPDF(){
  if (__isGeneratingPdf) return;
  __isGeneratingPdf = true;

  if (!window.SETPDF || typeof window.SETPDF.generate !== "function") {
    alert("El generador de PDF no está disponible.");
    __isGeneratingPdf = false;
    return;
  }

  if (!photos.length) {
    alert("No hay fotos para generar el PDF.");
    __isGeneratingPdf = false;
    return;
  }

  const btn = document.getElementById('btn-pdf');
  if (btn) btn.disabled = true;

  try {
    const reportCode = generateReportCode();
    const ctx = {
      VERSION_LABEL,
      reportCode,
      membreteEnabled: isReportMembreteEnabled(),
      reportMembrete: {
        mode: getReportMembreteMode(),
        textLines: getReportMembreteTextLines(),
        imageDataUrl: getReportMembreteImage()
      },
      reportNoteColor: getReportNoteColor(),
      template: getActiveTemplate(),
      sigImageDataUrl: getReportSigImage() || (getActiveTemplate()?.signatureImageDataUrl || ""),
      photos,
      getPhotoBlob: (id) => idbGetPhoto(id),
      blobToDataURL: async (blob, id) => {
        if (id && photoDataUrlCache.has(id)) return photoDataUrlCache.get(id);
        const dataUrl = await blobToDataURLStable(blob);
        if (id) photoDataUrlCache.set(id, dataUrl);
        return dataUrl;
      },
      titleUpper: (document.getElementById('ti_in').value || "").toUpperCase(),
      conclusion: document.getElementById('final_conclusion').value || "",
      dateIso: document.getElementById('f_date').value || "",
      nameUpper: (document.getElementById('f_nom').value || "").toUpperCase(),
      rankUpper: (document.getElementById('f_rank').value || "").toUpperCase(),
      formatDateLongEs,
      setFinalizedFlag
    };

    const res = await window.SETPDF.generate(ctx);

    // Guardar en Filesystem (Android/Capacitor)
    let saved = false;
    try { saved = await savePdfOnAndroid(res); } catch(e) { console.warn("Filesystem write falló:", e); }

    // Guardar en librería interna (puede fallar por cuota sin interrumpir el flujo)
    if (res?.dataUrl) {
      try { addPdfToLibrary({ dataUrl: res.dataUrl, fileName: res.fileName, reportCode }); }
      catch (libErr) { console.warn("No se pudo guardar en biblioteca PDF:", libErr?.message || libErr); }
    }

    // Abrir blobUrl si no se pudo guardar en filesystem
    if (!saved && res?.blobUrl) {
      try { window.open(res.blobUrl, "_blank"); } catch (_) {}
    }

    // Mostrar resultado
    if (res?.blobUrl && window.SETPDF?.showPdfModal) {
      window.SETPDF.showPdfModal(res.blobUrl);
    } else {
      alert("PDF generado. Revisa Descargas.");
    }
    window.lastPdfObjectUrl = res?.blobUrl || null;

  } catch (err) {
    console.error(err);
    alert("No se pudo generar el PDF.\n\nDetalle: " + (err?.message || err));
  } finally {
    __isGeneratingPdf = false;
    if (btn) btn.disabled = false;
  }
}

/***********************
 * WEATHER (Open-Meteo)
 ***********************/
function getSavedCity(){
  const raw = localStorage.getItem(WEATHER_CITY_KEY);
  if(!raw) return DEFAULT_CITY;
  try{
    const obj = JSON.parse(raw);
    if(obj?.name && typeof obj.lat === "number" && typeof obj.lon === "number") return obj;
  }catch{}
  return DEFAULT_CITY;
}
function saveCity(city){
  localStorage.setItem(WEATHER_CITY_KEY, JSON.stringify(city));
}

async function initWeather(){
  const city = getSavedCity();
  document.getElementById("wCity").textContent = city.name;
  await refreshWeather();
}

function weatherCodeToIcon(code){
  if (code === 0) return "☀️";
  if ([1,2].includes(code)) return "⛅";
  if (code === 3) return "☁️";
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return "🌧️";
  if ([95,96,99].includes(code)) return "⛈️";
  if ([71,73,75,77,85,86].includes(code)) return "❄️";
  return "⛅";
}

function weatherCodeToText(code){
  if (code === 0) return "Despejado";
  if (code === 1) return "Mayormente despejado";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if ([51,53,55].includes(code)) return "Llovizna";
  if ([61,63,65].includes(code)) return "Lluvia";
  if ([80,81,82].includes(code)) return "Chubascos";
  if ([71,73,75].includes(code)) return "Nieve";
  if ([95,96,99].includes(code)) return "Tormenta";
  return "Clima";
}

async function refreshWeather(){
  const city = getSavedCity();
  document.getElementById("wCity").textContent = city.name;
  document.getElementById("wDesc").textContent = "Cargando...";
  document.getElementById("wTemp").textContent = "--°C";
  document.getElementById("wMinMax").textContent = "-- / --";
  document.getElementById("wNote").textContent = "";

  try{
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(city.lat)}&longitude=${encodeURIComponent(city.lon)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSantiago`;

    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("Weather error");
    const data = await res.json();

    const temp = Math.round(data?.current?.temperature_2m);
    const code = data?.current?.weather_code;
    const tmax = Math.round((data?.daily?.temperature_2m_max || [])[0] ?? NaN);
    const tmin = Math.round((data?.daily?.temperature_2m_min || [])[0] ?? NaN);

    document.getElementById("wIcon").textContent = weatherCodeToIcon(code);
    document.getElementById("wDesc").textContent = weatherCodeToText(code);
    document.getElementById("wTemp").textContent = (Number.isFinite(temp) ? `${temp}°C` : "--°C");
    document.getElementById("wMinMax").textContent = (Number.isFinite(tmin) && Number.isFinite(tmax)) ? `${tmin}° / ${tmax}°` : "-- / --";

    const now = new Date();
    document.getElementById("wNote").textContent = `Actualizado: ${now.toLocaleString("es-CL", { timeZone: "America/Santiago" })}`;
  } catch(e){
    console.error(e);
    document.getElementById("wDesc").textContent = "No se pudo cargar";
    document.getElementById("wNote").textContent = "Verifica tu conexión a internet.";
  }
}

async function promptCity(){
  const name = prompt("Ingrese ciudad (ej: Osorno, Valdivia, Puerto Montt):");
  if(!name) return;

  try{
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es&format=json`;
    const res = await fetch(geoUrl, { cache: "no-store" });
    if(!res.ok) throw new Error("Geocoding error");
    const data = await res.json();
    const r = (data?.results || [])[0];
    if(!r) return alert("No se encontró la ciudad. Intente con otro nombre.");

    const city = { name: r.name, lat: r.latitude, lon: r.longitude };
    saveCity(city);
    await refreshWeather();
  } catch(e){
    console.error(e);
    alert("No se pudo cambiar la ciudad (sin conexión o error de servicio).");
  }
}

/***********************
 * UTM (mindicador.cl)
 ***********************/
function formatCLP(n){
  if(!Number.isFinite(n)) return "";
  return n.toLocaleString("es-CL");
}

async function refreshUTM(){
  const elVal = document.getElementById("utmValue");
  const elSrc = document.getElementById("utmSource");
  const elNote = document.getElementById("utmNote");

  if (!elVal || !elSrc || !elNote) return;

  elVal.textContent = "Cargando...";
  elSrc.textContent = "";
  elNote.textContent = "";

  try{
    const res = await fetch(UTM_URL, { cache: "no-store" });
    if(!res.ok) throw new Error("UTM error");
    const data = await res.json();

    const val = Number(String(data?.serie?.[0]?.valor ?? "").replace(",", "."));
    const fecha = data?.serie?.[0]?.fecha ? new Date(data.serie[0].fecha) : null;

    elVal.textContent = val ? `$${formatCLP(val)}` : "No disponible";
    elSrc.textContent = " (fuente: mindicador.cl)";
    if(fecha && !isNaN(fecha.getTime())){
      elNote.textContent = `Actualización: ${fecha.toLocaleDateString("es-CL")}`;
    } else {
      elNote.textContent = "";
    }
  } catch(e){
    console.error(e);
    elVal.textContent = "No disponible";
    elSrc.textContent = " (fuente: mindicador.cl)";
    elNote.textContent = "Sin conexión o error de servicio.";
  }
}

/***********************
 * JPL (alternancia semanal)
 ***********************/
function getChileNow(){
  const now = new Date();
  const s = now.toLocaleString("en-US", { timeZone: "America/Santiago" });
  return new Date(s);
}

function getStartOfWeekMondayChile(d){
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const day = date.getDay();
  const diffToMonday = (day === 0) ? -6 : (1 - day);
  date.setDate(date.getDate() + diffToMonday);
  date.setHours(0,0,0,0);
  return date;
}

function addDays(date, days){
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function weekLabelChile(startMonday){
  const endSunday = addDays(startMonday, 6);

  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const d1 = startMonday.getDate();
  const d2 = endSunday.getDate();
  const m1 = meses[startMonday.getMonth()];
  const m2 = meses[endSunday.getMonth()];

  if (startMonday.getMonth() === endSunday.getMonth()){
    return `semana ${d1} al ${d2} de ${m1}`;
  }
  return `semana ${d1} de ${m1} al ${d2} de ${m2}`;
}

function isSecondJplThisWeek(weekIndex){
  if (JPL_BASE_IS_SECOND) return (weekIndex % 2 === 0);
  return (weekIndex % 2 !== 0);
}

function updateJPL(){
  const valueEl = document.getElementById("jplValue");
  const noteEl = document.getElementById("jplWeekNote");
  if (!valueEl || !noteEl) return;

  const nowCL = getChileNow();
  const start = getStartOfWeekMondayChile(nowCL);

  const base = new Date(2026, 0, 12, 0, 0, 0);
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const weekIndex = Math.floor((start.getTime() - base.getTime()) / msWeek);

  const second = isSecondJplThisWeek(weekIndex);
  const jplText = second ? "SEGUNDO JPL" : "PRIMER JPL";

  valueEl.textContent = jplText;
  const label = weekLabelChile(start);
  noteEl.textContent = `Esta semana ${second ? "2do." : "1er."} Juzgado Policial Local — ${label}`;
}
