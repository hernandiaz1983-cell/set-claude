/* pdf-logic.js
 * - No depende del DOM excepto el modal (show/close).
 * - Expone window.SETPDF.generate(ctx)
 */

(function () {
  "use strict";

  // ----------------------------
  // ✅ Fuente Unicode (TTF) para acentos/ñ
  // Requiere: /fonts/DejaVuSans.ttf en el ROOT del build (misma carpeta raíz que index.html)
  // ----------------------------
  let __fontReady = false;
  let __fontAvailable = false;   // ✅ NUEVO: si el TTF cargó y se registró en jsPDF
  let __preferredFont = "helvetica";
  const IS_CAPACITOR = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  async function fetchFirstOk(urls){
    let lastErr = null;
    for (const u of urls){
      try{
        const res = await fetch(u, { cache: "no-store" });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          return { buf, okUrl: u };
        }
        lastErr = new Error(`HTTP ${res.status} en ${u}`);
      }catch(e){
        lastErr = e;
      }
    }
    throw lastErr || new Error("No se pudo cargar TTF");
  }

  async function ensurePdfFont(doc){
    if (__fontReady) return;

    __fontReady = true;
    __fontAvailable = false;
    __preferredFont = "helvetica";

    try {
      // ✅ Probamos rutas para WEB y APK (Capacitor/Cordova) + variaciones de basepath
      const candidates = [
        "./fonts/DejaVuSans.ttf",
        "fonts/DejaVuSans.ttf",
        "/fonts/DejaVuSans.ttf",
        "http://localhost/fonts/DejaVuSans.ttf",
        "https://localhost/fonts/DejaVuSans.ttf"
      ];

      const { buf, okUrl } = await fetchFirstOk(candidates);

      // ArrayBuffer -> base64 (sin reventar el stack)
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      // Registrar fuente en jsPDF
      doc.addFileToVFS("DejaVuSans.ttf", base64);
      doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
      doc.addFont("DejaVuSans.ttf", "DejaVu", "bold");

      // ✅ Verifica que realmente quedó en la lista
      const list = (doc.getFontList && doc.getFontList()) ? doc.getFontList() : {};
      const ok = !!(list && list.DejaVu);

      console.log("✅ DejaVu TTF cargado desde:", okUrl, "bytes:", buf.byteLength);

      if (ok){
        __fontAvailable = true;
        __preferredFont = "DejaVu";
        console.log("✅ Fuente DejaVu registrada correctamente.");
      } else {
        __fontAvailable = false;
        __preferredFont = "helvetica";
        console.warn("⚠️ DejaVu no quedó registrada en getFontList(); usando helvetica.");
      }

    } catch (e) {
      __fontAvailable = false;
      __preferredFont = "helvetica";
      console.warn("⚠️ Fuente DejaVu no disponible, usando helvetica:", e);
    }
  }

  // ✅ “setFont” seguro: JAMÁS intenta DejaVu si no cargó
  function safeSetFont(doc, font, style){
    const st = style || "normal";
    let want = String(font || __preferredFont || "helvetica");

    if (want === "DejaVu" && !__fontAvailable) {
      want = "helvetica";
    }

    try {
      doc.setFont(want, st);
    } catch (_) {
      try { doc.setFont("helvetica", st); } catch (__){}
    }
  }

  function normalizeText(s){ return (s || "").replace(/\u00A0/g, " ").trim(); }

  function splitLongTokenByWidth(doc, token, maxWidth) {
    const out = [];
    let chunk = "";
    for (const ch of token) {
      const test = chunk + ch;
      if (doc.getTextWidth(test) <= maxWidth) chunk = test;
      else { if (chunk) out.push(chunk); chunk = ch; }
    }
    if (chunk) out.push(chunk);
    return out;
  }

  function wordsSafe(doc, text, maxWidth) {
    const raw = normalizeText(text).replace(/\s+/g, " ");
    if (!raw) return [];
    const tokens = raw.split(" ");
    const out = [];
    for (const tok of tokens) {
      if (!tok) continue;
      if (doc.getTextWidth(tok) <= maxWidth) out.push(tok);
      else out.push(...splitLongTokenByWidth(doc, tok, maxWidth));
    }
    return out;
  }

  function drawJustifiedMixedSegments(doc, segments, x, y, width) {
    if (!segments || segments.length === 0) return;

    if (segments.length === 1) {
      safeSetFont(doc, segments[0].forcedFont || null, segments[0].font);
      doc.text(segments[0].text, x, y);
      return;
    }

    let totalW = 0;
    const widths = [];
    for (const seg of segments) {
      safeSetFont(doc, seg.forcedFont || null, seg.font);
      const w = doc.getTextWidth(seg.text);
      widths.push(w);
      totalW += w;
    }

    const gaps = segments.length - 1;
    if (totalW >= width || gaps <= 0) {
      let cx = x;
      for (let i = 0; i < segments.length; i++) {
        safeSetFont(doc, segments[i].forcedFont || null, segments[i].font);
        doc.text(segments[i].text, cx, y);
        cx += widths[i];
        if (i < segments.length - 1) {
          safeSetFont(doc, null, "normal");
          const sp = doc.getTextWidth(" ");
          cx += sp;
        }
      }
      return;
    }

    const gapSize = (width - totalW) / gaps;

    let cx = x;
    for (let i = 0; i < segments.length; i++) {
      safeSetFont(doc, segments[i].forcedFont || null, segments[i].font);
      doc.text(segments[i].text, cx, y);
      cx += widths[i];
      if (i < segments.length - 1) cx += gapSize;
    }
  }

  function buildFirstLineWithLabel(doc, label, words, width) {
    const line = [];
    safeSetFont(doc, null, "bold");
    let currentW = doc.getTextWidth(label);

    safeSetFont(doc, null, "normal");
    const minSpace = doc.getTextWidth(" ");
    currentW += minSpace;

    for (const w of words) {
      const test = line.length ? (currentW + doc.getTextWidth(w) + minSpace) : (currentW + doc.getTextWidth(w));
      if (test <= width) {
        line.push(w);
        currentW = test;
      } else {
        break;
      }
    }
    return line;
  }

  function buildLines(doc, words, width) {
    const lines = [];
    let line = [];
    for (const w of words) {
      const testLine = line.length ? [...line, w] : [w];
      const testText = testLine.join(" ");
      if (doc.getTextWidth(testText) <= width) line = testLine;
      else { if (line.length) lines.push(line); line = [w]; }
    }
    if (line.length) lines.push(line);
    return lines;
  }

  function drawJustifiedWords(doc, words, x, y, width) {
    if (!words || words.length === 0) return;
    if (words.length === 1) { doc.text(words[0], x, y); return; }

    const wordsWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
    const gaps = words.length - 1;
    if (wordsWidth >= width || gaps <= 0) { doc.text(words.join(" "), x, y); return; }

    const gapSize = (width - wordsWidth) / gaps;
    let cursorX = x;
    for (let i = 0; i < words.length; i++) {
      doc.text(words[i], cursorX, y);
      cursorX += doc.getTextWidth(words[i]);
      if (i < words.length - 1) cursorX += gapSize;
    }
  }

  function printTitleUnderlinedSafe(doc, titleText, pW, usefulW, state, pageBreakFn) {
    safeSetFont(doc, null, "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);

    const words = wordsSafe(doc, titleText, usefulW);
    const lines = buildLines(doc, words, usefulW).map(arr => arr.join(" "));

    for (const line of lines) {
      if (state.y > state.bottomLimit) pageBreakFn();

      const tw = doc.getTextWidth(line);
      const tx = (pW - tw) / 2;

      doc.text(line, pW / 2, state.y, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(tx, state.y + 1.2, tx + tw, state.y + 1.2);

      state.y += 7;
    }
    state.y += 6;
  }

  function imprimirEtiquetaEnMismaLinea_CuadradoTotal(doc, etiqueta, texto, x, width, lineHeight, state, pageBreakFn, color=null) {
    const t = normalizeText(texto);
    if (!t) return;

    const setColor = () => {
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      else doc.setTextColor(0);
    };

    const label = (etiqueta || "").trim();
    safeSetFont(doc, null, "normal");
    setColor();
    const allWords = wordsSafe(doc, t, width);

    const firstLineWords = buildFirstLineWithLabel(doc, label, allWords, width);
    const remainingWords = allWords.slice(firstLineWords.length);
    const restLines = buildLines(doc, remainingWords, width);

    if (state.y > state.bottomLimit) pageBreakFn();

    const segments = [{ text: label, font: "bold", forcedFont: "helvetica" }, ...firstLineWords.map(w => ({ text: w, font: "normal" }))];

    setColor();
    if (restLines.length > 0) {
      drawJustifiedMixedSegments(doc, segments, x, state.y, width);
    } else {
      let cx = x;
      safeSetFont(doc, "helvetica", "bold"); doc.text(label, cx, state.y); cx += doc.getTextWidth(label);
      safeSetFont(doc, null, "normal"); doc.text(" " + firstLineWords.join(" "), cx, state.y);
    }

    state.y += lineHeight;

    safeSetFont(doc, null, "normal");
    for (let i = 0; i < restLines.length; i++) {
      if (state.y > state.bottomLimit) pageBreakFn();
      const isLast = (i === restLines.length - 1);
      if (!isLast) drawJustifiedWords(doc, restLines[i], x, state.y, width);
      else doc.text(restLines[i].join(" "), x, state.y);
      state.y += lineHeight;
    }

    state.y += 3;
    doc.setTextColor(0);
  }

  let __lastBlobUrl = null;

  function showPdfModal(blobUrl){
    const modal = document.getElementById("pdfModal");
    const btnOpen = document.getElementById("btnOpenPdf");
    const txt = document.getElementById("pdfModalText");

    if (!modal || !btnOpen || !txt) return;

    if (blobUrl) __lastBlobUrl = blobUrl;

    if (blobUrl) {
      btnOpen.style.display = "block";
      btnOpen.onclick = () => { window.open(blobUrl, "_blank"); };
      txt.textContent = "Si el documento no se abre automáticamente, revisa la carpeta Descargas.";
    } else {
      btnOpen.style.display = "none";
      txt.textContent = "Documento generado. Revisa la carpeta Descargas.";
    }

    modal.style.display = "flex";
  }

  function closePdfModal(){
    const modal = document.getElementById("pdfModal");
    if (modal) modal.style.display = "none";

    // ✅ libera memoria (importante en APK)
    if (__lastBlobUrl) {
      try { URL.revokeObjectURL(__lastBlobUrl); } catch(e){}
      __lastBlobUrl = null;
    }
  }

  async function dataUrlToCanvas(dataUrl, maxPx = 1600){
    const img = new Image();
    img.decoding = "async";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;

    const scale = Math.min(1, maxPx / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx2 = canvas.getContext("2d", { alpha: false });
    ctx2.fillStyle = "#fff";
    ctx2.fillRect(0, 0, w, h);
    ctx2.drawImage(img, 0, 0, w, h);

    return canvas;
  }

  async function generate(ctx){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:"p", unit:"mm", format:"legal" });

    await ensurePdfFont(doc);

    // ✅ PARCHE 3B: si DejaVu no quedó registrada, nunca usarla
    try{
      const list = doc.getFontList ? doc.getFontList() : {};
      if (!(list && (list.DejaVu || list.Dejavu))) {
        __preferredFont = "helvetica";
      }
    }catch(_){
      __preferredFont = "helvetica";
    }

    function mapTemplateFontToPdf(fontId){
      const f = String(fontId || "").toLowerCase();
      if (["times", "timesnewroman", "georgia", "garamond", "cambria"].includes(f)) return "times";
      if (["courier", "couriernew"].includes(f)) return "courier";
      if (["helvetica", "arial", "calibri", "tahoma", "verdana"].includes(f)) return "helvetica";

      // ✅ Default seguro: SOLO usar DejaVu si realmente se cargó el TTF
      return (__fontReady ? "DejaVu" : "helvetica");
    }

    __preferredFont = mapTemplateFontToPdf(ctx?.template?.font);
    if (!__fontReady) __preferredFont = "helvetica";
    safeSetFont(doc, null, "normal");

    const pW = doc.internal.pageSize.getWidth();
    const pH = doc.internal.pageSize.getHeight();

    const marginTop = 18;
    const marginBottom = 18;
    const leftCm = Number(ctx?.template?.margins?.leftCm);
    const rightCm = Number(ctx?.template?.margins?.rightCm);
    const marginLeft = Number.isFinite(leftCm) ? Math.min(35, Math.max(5, leftCm * 10)) : 20;
    const marginRight = Number.isFinite(rightCm) ? Math.min(35, Math.max(5, rightCm * 10)) : 20;
    const usefulW = pW - marginLeft - marginRight;

    let membrete = null;
    if (ctx.membreteEnabled !== false) {
      if (ctx.reportMembrete && (ctx.reportMembrete.imageDataUrl || (ctx.reportMembrete.textLines || []).join("").trim())) {
        membrete = ctx.reportMembrete;
      } else if (ctx.template && ctx.template.membrete) {
        membrete = ctx.template.membrete;
      }
    }
    const membreteSize = 30; // 3 x 3 cm
    const membreteY = 10;

    const state = { y: marginTop, bottomLimit: pH - marginBottom };

    const pageBreakFn = () => {
      doc.addPage();
      state.y = marginTop;
    };

    function trimToWidth(text, maxWidth, maxChars){
      let t = String(text || "");
      if (Number.isFinite(maxChars) && maxChars > 0) {
        t = t.slice(0, maxChars);
      }
      while (t && doc.getTextWidth(t) > maxWidth) {
        t = t.slice(0, -1);
      }
      return t.trim();
    }

    function drawMembrete(){
      if (!membrete) return;
      const x = marginLeft;
      const y = membreteY;
      const boxW = membreteSize;
      const boxH = membreteSize;

      if (membrete.mode === "image" && membrete.imageDataUrl) {
        const dataUrl = membrete.imageDataUrl;
        const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        const targetH = 25; // 2.5 cm
        let targetW = targetH;
        try {
          const props = doc.getImageProperties(dataUrl);
          if (props?.width && props?.height) {
            targetW = targetH * (props.width / props.height);
          }
        } catch (_) {}
        doc.addImage(dataUrl, format, x, y, targetW, targetH, undefined, "FAST");
        return;
      }

      if (membrete.mode === "text" && Array.isArray(membrete.textLines)) {
        safeSetFont(doc, null, "bold");
        doc.setFontSize(7.5);
        const lines = membrete.textLines.slice(0, 3);
        const lineHeight = 3.1;
        const textBoxW = Math.min(50, usefulW);
        const startY = y + lineHeight;
        for (let i = 0; i < lines.length; i++) {
          const line = trimToWidth((lines[i] || "").toUpperCase(), textBoxW, 30);
          if (line) doc.text(line, x + (textBoxW / 2), startY + (i * lineHeight), { align: "center" });
        }
      }
    }

    if (membrete) {
      drawMembrete();
      state.y = 30;
    }

    // TITULO
    printTitleUnderlinedSafe(doc, ctx.titleUpper, pW, usefulW, state, pageBreakFn);

    // FOTOS: horizontal=100mm(10cm), cuadrada=100x100mm(10x10cm), vertical=80mm(8cm). Alto siempre proporcional.
    doc.setFontSize(12);

    for (let i = 0; i < ctx.photos.length; i++) {
      const p = ctx.photos[i];
      const blob = await ctx.getPhotoBlob(p.id);
      if (!blob) continue;

      // ✅ PARCHE 2: pasar id para usar cache base64 y evitar reconversion
      const dataUrl = await ctx.blobToDataURL(blob, p.id);

      const FIXED_IMG_W = p.hRatio > 1 ? 80 : 100;
      let finalW = Math.min(FIXED_IMG_W, usefulW);
      let finalH = finalW * p.hRatio;

      if (state.y + finalH + 25 > state.bottomLimit) pageBreakFn();

      const xImg = (pW - finalW) / 2;

      doc.addImage(dataUrl, "JPEG", xImg, state.y, finalW, finalH, undefined, "FAST");

      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(xImg, state.y, finalW, finalH);

      state.y += finalH + 8;

      imprimirEtiquetaEnMismaLinea_CuadradoTotal(
        doc,
        `FOTOGRAFÍA ${(i+1).toString().padStart(2,"0")}:`,
        (p.d || ""),
        marginLeft,
        usefulW,
        5,
        state,
        pageBreakFn
      );

      state.y += 2;
    }

    // NOTA FINAL
    if (ctx.conclusion && ctx.conclusion.trim()) {
      if (state.y + 20 > state.bottomLimit) pageBreakFn();

      let noteColor = [220, 38, 38];
      const picked = String(ctx.reportNoteColor || "").toLowerCase();
      if (picked === "black") noteColor = [0, 0, 0];
      else if (picked === "blue") noteColor = [37, 99, 235];
      else if (picked === "yellow") noteColor = [234, 179, 8];
      else if (picked === "green") noteColor = [22, 163, 74];
      else if (ctx.template?.noteColor) {
        const c = String(ctx.template.noteColor).toLowerCase();
        if (c === "black") noteColor = [0, 0, 0];
        else if (c === "blue") noteColor = [37, 99, 235];
        else if (c === "green") noteColor = [22, 163, 74];
      }

      imprimirEtiquetaEnMismaLinea_CuadradoTotal(
        doc,
        "NOTA:",
        ctx.conclusion,
        marginLeft,
        usefulW,
        5,
        state,
        pageBreakFn,
        noteColor
      );
    }

    // FIRMA
    if (state.y + 30 > state.bottomLimit) pageBreakFn();
    else state.y += 12;

    doc.setFontSize(12);
    doc.setTextColor(0);
    safeSetFont(doc, null, "normal");

    const fechaTexto = (function buildOsornoDate(iso){
      if (!iso) return "";
      const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const d = new Date(iso + "T12:00:00");
      if (Number.isNaN(d.getTime())) return iso;
      return `OSORNO ${d.getDate()} de ${months[d.getMonth()]} del ${d.getFullYear()}`;
    })(ctx.dateIso);
    doc.text(fechaTexto, pW - marginRight, state.y, { align: "right" });
    state.y += 14;

    const sigImgUrl = String(ctx.sigImageDataUrl || "");
    if (sigImgUrl && sigImgUrl.startsWith("data:image/")) {
      // Firma digital: máx 50mm (5cm) ancho, alto proporcional
      const SIG_MAX_W = 50;
      let sigW = SIG_MAX_W;
      let sigH = sigW * 0.4; // fallback proporcional 2.5:1
      try {
        const props = doc.getImageProperties(sigImgUrl);
        if (props?.width && props?.height && props.width > 0) {
          sigH = sigW * (props.height / props.width);
        }
      } catch (_) {}
      if (state.y + sigH + 8 > state.bottomLimit) pageBreakFn();
      const xSig = (pW - sigW) / 2;
      const format = sigImgUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(sigImgUrl, format, xSig, state.y, sigW, sigH, undefined, "FAST");
      state.y += sigH + 4;
    } else {
      // Firma de texto: nombre y cargo centrados
      state.y += 4;
      safeSetFont(doc, null, "bold");
      doc.text(ctx.nameUpper, pW / 2, state.y, { align: "center" });
      state.y += 5;
      safeSetFont(doc, null, "normal");
      doc.text(ctx.rankUpper, pW / 2, state.y, { align: "center" });
    }

    // PAGINAS
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`${i}/${totalPages}`, pW - marginRight, 10, { align:"right" });
    }

    // Descargar
    const code = String(ctx.reportCode || "").trim();
    const fileName = code ? `Reporte_${code}.pdf` : `Reporte_Fotografico_${String(ctx.VERSION_LABEL).replace(/\s+/g,"_")}.pdf`;

    let pdfDataUrl = "";
    try {
      pdfDataUrl = doc.output("datauristring");
    } catch (_) {}

    let blobUrl = null;
    try {
      doc.save(fileName);
    } catch (_) {
      // fallback: crear enlace de descarga manual
      try {
        const pdfBlob = doc.output("blob");
        blobUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (__) {}
    }

    if (typeof ctx.setFinalizedFlag === "function") ctx.setFinalizedFlag();

    return { blobUrl, dataUrl: pdfDataUrl, fileName };
  }

  window.SETPDF = {
    generate,
    showPdfModal,
    closePdfModal
  };
})();
