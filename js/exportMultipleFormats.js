function exportPlugin(editor) {
  const modal = editor.Modal;
  function getLiveCanvasDoc(editor) {
    const iframe = editor.Canvas && editor.Canvas.getFrameEl ? editor.Canvas.getFrameEl() : null;
    return iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
  }

  function getHtmlWithCurrentFormState(editor) {
    const baseHtml = editor.getHtml();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = baseHtml;

    const liveDoc = getLiveCanvasDoc(editor);
    if (!liveDoc || !liveDoc.body) return tempDiv.innerHTML;

    const selectors = [
      'input[type="checkbox"]',
      'input[type="radio"]',
      "textarea",
      "select",
    ];

    selectors.forEach((selector) => {
      const liveNodes = liveDoc.body.querySelectorAll(selector);
      const exportNodes = tempDiv.querySelectorAll(selector);
      const len = Math.min(liveNodes.length, exportNodes.length);

      for (let i = 0; i < len; i++) {
        const liveNode = liveNodes[i];
        const exportNode = exportNodes[i];

        if (liveNode.matches('input[type="checkbox"], input[type="radio"]')) {
          if (liveNode.checked) {
            exportNode.setAttribute("checked", "checked");
          } else {
            exportNode.removeAttribute("checked");
          }
        } else if (liveNode.matches("textarea")) {
          exportNode.textContent = liveNode.value || "";
        } else if (liveNode.matches("select")) {
          const liveOptions = liveNode.options || [];
          const exportOptions = exportNode.options || [];
          const optionLen = Math.min(liveOptions.length, exportOptions.length);
          for (let j = 0; j < optionLen; j++) {
            if (liveOptions[j].selected) {
              exportOptions[j].setAttribute("selected", "selected");
            } else {
              exportOptions[j].removeAttribute("selected");
            }
          }
        }
      }
    });

    // Freeze visual node dimensions from the live canvas so resized media keeps its export aspect ratio.
    let syncedVisualDimensions = 0;
    ["img", "canvas", "svg"].forEach((selector) => {
      const liveNodes = liveDoc.body.querySelectorAll(selector);
      const exportNodes = tempDiv.querySelectorAll(selector);
      const len = Math.min(liveNodes.length, exportNodes.length);

      for (let i = 0; i < len; i++) {
        const liveNode = liveNodes[i];
        const exportNode = exportNodes[i];
        if (!liveNode || !exportNode) continue;

        const rect = liveNode.getBoundingClientRect ? liveNode.getBoundingClientRect() : null;
        const width = rect && rect.width ? Math.round(rect.width) : 0;
        const height = rect && rect.height ? Math.round(rect.height) : 0;

        if (width > 0) {
          exportNode.style.width = `${width}px`;
          exportNode.setAttribute("width", String(width));
        }

        if (height > 0) {
          exportNode.style.height = `${height}px`;
          exportNode.setAttribute("height", String(height));
        }

        try {
          const computed = liveDoc.defaultView && liveDoc.defaultView.getComputedStyle
            ? liveDoc.defaultView.getComputedStyle(liveNode)
            : null;
          if (computed && computed.objectFit && computed.objectFit !== "fill") {
            exportNode.style.objectFit = computed.objectFit;
          }
        } catch (styleErr) {
          // Ignore computed-style access issues for detached nodes.
        }

        if (width > 0 || height > 0) {
          syncedVisualDimensions++;
        }
      }
    });
    console.debug("[Export] Synced visual node dimensions from live canvas", { syncedVisualDimensions });

    const exportNodesById = new Map();
    tempDiv.querySelectorAll("[id]").forEach((node) => {
      if (node.id) {
        exportNodesById.set(node.id, node);
      }
    });

    liveDoc.body.querySelectorAll("[id]").forEach((liveNode) => {
      const exportNode = exportNodesById.get(liveNode.id);
      if (!exportNode) return;

      if (
        liveNode.hasAttribute("contenteditable") ||
        liveNode.hasAttribute("data-template-text") ||
        liveNode.hasAttribute("my-input-json")
      ) {
        exportNode.innerHTML = liveNode.innerHTML;
        return;
      }

      if (exportNode.innerHTML !== liveNode.innerHTML && shouldSyncTextNodeContent(exportNode, liveNode)) {
        exportNode.innerHTML = liveNode.innerHTML;
      }
    });

    if (typeof window.syncFlowLayoutsFromLiveDoc === "function") {
      window.syncFlowLayoutsFromLiveDoc(tempDiv, liveDoc.body);
    }

    return tempDiv.innerHTML;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function fetchUrlAsDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return blobToDataUrl(blob);
  }

  function getLiveNodeForExportNode(exportNode, liveDoc) {
    if (!exportNode || !liveDoc) return null;
    if (exportNode.id) {
      const byId = liveDoc.getElementById(exportNode.id);
      if (byId) return byId;
    }
    return null;
  }

  function shouldSyncTextNodeContent(exportNode, liveNode) {
    if (!exportNode || !liveNode) return false;

    const tag = String(exportNode.tagName || "").toUpperCase();
    const textTags = ["P", "SPAN", "DIV", "SECTION", "ARTICLE", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "LABEL"];

    if (!textTags.includes(tag)) return false;

    if (liveNode.querySelector && liveNode.querySelector("img, canvas, svg, table, input, textarea, select")) {
      return false;
    }

    return true;
  }

  function getVisualNodeSize(exportNode, liveNode) {
    const sourceNode = liveNode || exportNode;
    let width = 0;
    let height = 0;

    if (sourceNode && sourceNode.getBoundingClientRect) {
      const rect = sourceNode.getBoundingClientRect();
      width = rect.width || width;
      height = rect.height || height;
    }

    if (!width) {
      width =
        parseFloat(exportNode.getAttribute && exportNode.getAttribute("width")) ||
        exportNode.width ||
        parseFloat(exportNode.style && exportNode.style.width) ||
        width;
    }

    if (!height) {
      height =
        parseFloat(exportNode.getAttribute && exportNode.getAttribute("height")) ||
        exportNode.height ||
        parseFloat(exportNode.style && exportNode.style.height) ||
        height;
    }

    if ((!width || !height) && sourceNode && sourceNode.viewBox && sourceNode.viewBox.baseVal) {
      width = width || sourceNode.viewBox.baseVal.width;
      height = height || sourceNode.viewBox.baseVal.height;
    }

    if (!width) width = 320;
    if (!height) height = Math.round(width * 0.6);

    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    };
  }

  function svgNodeToDataUrl(svgNode) {
    try {
      const clone = svgNode.cloneNode(true);
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      const markup = new XMLSerializer().serializeToString(clone);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    } catch (err) {
      console.warn("Failed to serialize SVG node:", err);
      return "";
    }
  }

  async function getVisualNodeData(exportNode, editor) {
    if (!exportNode || exportNode.nodeType !== 1) {
      return { dataUrl: "", width: 0, height: 0 };
    }

    const liveDoc = getLiveCanvasDoc(editor);
    const liveNode = getLiveNodeForExportNode(exportNode, liveDoc);
    const sourceNode = liveNode || exportNode;
    const tag = (exportNode.tagName || "").toUpperCase();
    const size = getVisualNodeSize(exportNode, liveNode);

    try {
      if (tag === "IMG") {
        const src = (sourceNode.currentSrc || sourceNode.src || exportNode.getAttribute("src") || "").trim();
        if (!src) return { dataUrl: "", width: size.width, height: size.height };
        if (src.startsWith("data:")) {
          return { dataUrl: src, width: size.width, height: size.height };
        }
        return {
          dataUrl: await fetchUrlAsDataUrl(src),
          width: size.width,
          height: size.height,
        };
      }

      if (tag === "CANVAS" && sourceNode.toDataURL) {
        return {
          dataUrl: sourceNode.toDataURL("image/png"),
          width: size.width,
          height: size.height,
        };
      }

      if (tag === "SVG") {
        return {
          dataUrl: svgNodeToDataUrl(sourceNode),
          width: size.width,
          height: size.height,
        };
      }
    } catch (err) {
      console.warn("Failed to resolve visual node data:", err);
    }

    return { dataUrl: "", width: size.width, height: size.height };
  }

  function replaceVisualNodeWithImage(node, dataUrl, size) {
    if (!node || !dataUrl) return;
    let finalWidth = size && size.width ? size.width : parseFloat(node.style.width) || 0;
    let finalHeight = size && size.height ? size.height : parseFloat(node.style.height) || 0;

    if (!finalWidth && node.getAttribute && node.getAttribute("width")) {
      finalWidth = parseFloat(node.getAttribute("width")) || 0;
    }
    if (!finalHeight && node.getAttribute && node.getAttribute("height")) {
      finalHeight = parseFloat(node.getAttribute("height")) || 0;
    }

    finalWidth = finalWidth > 0 ? Math.round(finalWidth) : 0;
    finalHeight = finalHeight > 0 ? Math.round(finalHeight) : 0;

    if ((node.tagName || "").toUpperCase() === "IMG") {
      node.setAttribute("src", dataUrl);
      if (finalWidth > 0) {
        node.style.width = `${finalWidth}px`;
        node.setAttribute("width", String(finalWidth));
      }
      if (finalHeight > 0) {
        node.style.height = `${finalHeight}px`;
        node.setAttribute("height", String(finalHeight));
      } else {
        node.style.height = "auto";
      }
      return;
    }

    const img = document.createElement("img");
    img.src = dataUrl;
    img.style.display = "block";
    if (finalWidth > 0) {
      img.style.width = `${finalWidth}px`;
      img.setAttribute("width", String(finalWidth));
    }
    if (finalHeight > 0) {
      img.style.height = `${finalHeight}px`;
      img.setAttribute("height", String(finalHeight));
    } else {
      img.style.height = "auto";
    }
    if (node.id) img.id = node.id;
    if (node.className) img.className = node.className;
    node.parentNode && node.parentNode.replaceChild(img, node);
  }

  async function inlineVisualNodes(container, editor) {
    const visualNodes = Array.from(container.querySelectorAll("img, canvas, svg"));
    let replacedVisualNodes = 0;
    for (const node of visualNodes) {
      if ((node.tagName || "").toUpperCase() === "SVG" && node.closest("defs")) continue;
      const visual = await getVisualNodeData(node, editor);
      if (!visual.dataUrl) continue;
      replaceVisualNodeWithImage(node, visual.dataUrl, visual);
      replacedVisualNodes++;
    }
    console.debug("[Export] Inlined visual nodes", { replacedVisualNodes });
    return container;
  }

  function cleanupRichExportContainer(container) {
    if (!container) return container;

    container.querySelectorAll('.page-break, [class*="page-break"]').forEach((el) => el.remove());
    container.querySelectorAll('script').forEach((el) => el.remove());

    container.querySelectorAll('[data-gjs-type], [data-gjs-draggable], [data-gjs-editable], [data-gjs-hoverable], [data-gjs-droppable], [contenteditable], [spellcheck]').forEach((el) => {
      el.removeAttribute('data-gjs-type');
      el.removeAttribute('data-gjs-draggable');
      el.removeAttribute('data-gjs-editable');
      el.removeAttribute('data-gjs-hoverable');
      el.removeAttribute('data-gjs-droppable');
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });

    const layoutSelectors = [
      '.page-container',
      '.page-content',
      '.header-wrapper',
      '.page-header-element',
      '.content-wrapper',
      '.main-content-area',
      '.footer-wrapper',
      '.page-footer-element',
    ];

    layoutSelectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach((el) => {
        el.style.position = 'static';
        el.style.left = 'auto';
        el.style.top = 'auto';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.width = '100%';
        el.style.maxWidth = '100%';
        el.style.height = 'auto';
        el.style.minHeight = '0';
        el.style.maxHeight = 'none';
        el.style.transform = 'none';
        el.style.overflow = 'visible';
        el.style.pageBreakBefore = 'auto';
        el.style.pageBreakAfter = 'auto';
        el.style.breakBefore = 'auto';
        el.style.breakAfter = 'auto';
        el.style.float = 'none';
      });
    });

    container.querySelectorAll('figure').forEach((el) => {
      el.style.margin = '0 0 12px 0';
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
    });

    container.querySelectorAll('img').forEach((el) => {
      const width =
        parseFloat(el.style.width) ||
        parseFloat(el.getAttribute('width')) ||
        0;
      const height =
        parseFloat(el.style.height) ||
        parseFloat(el.getAttribute('height')) ||
        0;

      const naturalWidth = el.naturalWidth || el.width || 0;
      const naturalHeight = el.naturalHeight || el.height || 0;

      let finalWidth = width;
      let finalHeight = height;

      if (!finalWidth && finalHeight && naturalWidth && naturalHeight) {
        finalWidth = Math.round((finalHeight * naturalWidth) / Math.max(1, naturalHeight));
      }
      if (!finalHeight && finalWidth && naturalWidth && naturalHeight) {
        finalHeight = Math.round((finalWidth * naturalHeight) / Math.max(1, naturalWidth));
      }

      if (finalWidth > 0) {
        const roundedWidth = Math.round(finalWidth);
        el.style.width = `${roundedWidth}px`;
        el.setAttribute('width', String(roundedWidth));
      }

      if (finalHeight > 0) {
        const roundedHeight = Math.round(finalHeight);
        el.style.height = `${roundedHeight}px`;
        el.setAttribute('height', String(roundedHeight));
      } else {
        el.style.height = 'auto';
      }

      el.style.maxWidth = '100%';
    });

    container.querySelectorAll('table').forEach((el) => {
      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.tableLayout = 'fixed';
      el.style.borderCollapse = 'collapse';
      el.style.marginBottom = '12px';
    });

    container.querySelectorAll('td, th').forEach((el) => {
      el.style.wordBreak = 'break-word';
      el.style.whiteSpace = 'normal';
    });

    container.querySelectorAll('img, table, svg, canvas').forEach((el) => {
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
      el.style.maxWidth = '100%';
    });

    return container;
  }

  function getRichExportStyleOverrides(options = {}) {
    const imageMaxWidthPt = options.imageMaxWidthPt || 375;
    return `
      @page {
        margin: 12mm !important;
      }
      html, body {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .page-container,
      .page-content,
      .header-wrapper,
      .page-header-element,
      .content-wrapper,
      .main-content-area,
      .footer-wrapper,
      .page-footer-element {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        transform: none !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        break-before: auto !important;
        break-after: auto !important;
      }
      .page-break,
      [class*="page-break"] {
        display: none !important;
        height: 0 !important;
      }
      figure,
      table,
      img,
      svg,
      canvas {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        max-width: 100% !important;
      }
      img {
        display: block !important;
        max-width: ${imageMaxWidthPt}pt !important;
        margin: 8pt 0 !important;
      }
      table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        margin: 8pt 0 !important;
      }
      td, th {
        word-break: break-word !important;
        white-space: normal !important;
      }
      p, div, section, article, table, figure, ul, ol, li {
        page-break-before: auto !important;
        page-break-after: auto !important;
        margin-top: 0 !important;
        margin-bottom: 8pt !important;
      }
    `;
  }

  async function prepareRichExportContainer(editor, options = {}) {
    const exportOptions = {
      convertCharts: true,
      inlineVisuals: true,
      ...options,
    };

    let html = getHtmlWithCurrentFormState(editor);
    if (exportOptions.convertCharts) {
      html = await convertHighchartsToPNG(html, editor);
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    cleanupRichExportContainer(tempDiv);

    if (exportOptions.inlineVisuals) {
      await inlineVisualNodes(tempDiv, editor);
      cleanupRichExportContainer(tempDiv);
    }

    return tempDiv;
  }

  function sanitizeRichExportCss(css) {
    return String(css || "")
      .replace(/@page\s*\{[\s\S]*?\}/gi, "")
      .replace(/page-break-(before|after|inside)\s*:\s*[^;}{]+;?/gi, "")
      .replace(/break-(before|after|inside)\s*:\s*[^;}{]+;?/gi, "");
  }

  async function prepareWordExportContainer(editor) {
    const tempDiv = await prepareRichExportContainer(editor);

    let preparedWordImages = 0;

    tempDiv.querySelectorAll('img').forEach((el) => {
      const width =
        parseFloat(el.style.width) ||
        parseFloat(el.getAttribute('width')) ||
        el.width ||
        0;
      const height =
        parseFloat(el.style.height) ||
        parseFloat(el.getAttribute('height')) ||
        el.height ||
        0;

      const naturalWidth = el.naturalWidth || width || 420;
      const naturalHeight = el.naturalHeight || height || 0;

      let finalWidthPx = width || 0;
      let finalHeightPx = height || 0;

      if (!finalWidthPx && finalHeightPx && naturalWidth && naturalHeight) {
        finalWidthPx = Math.round((finalHeightPx * naturalWidth) / Math.max(1, naturalHeight));
      }
      if (!finalHeightPx && finalWidthPx && naturalWidth && naturalHeight) {
        finalHeightPx = Math.round((finalWidthPx * naturalHeight) / Math.max(1, naturalWidth));
      }
      if (!finalWidthPx) {
        finalWidthPx = naturalWidth || 420;
      }

      // Keep dimensions predictable for Word while preserving the edited aspect ratio.
      const clampedWidthPx = Math.min(Math.max(finalWidthPx, 1), 1200);
      const widthPt = Math.round(clampedWidthPx * 0.75);
      const heightPt = finalHeightPx
        ? Math.round(finalHeightPx * 0.75)
        : 0;

      el.style.display = 'block';
      el.style.width = `${widthPt}pt`;
      el.style.maxWidth = `${widthPt}pt`;
      el.style.height = heightPt ? `${Math.max(80, heightPt)}pt` : 'auto';
      el.setAttribute('width', String(Math.round(clampedWidthPx)));
      if (finalHeightPx > 0) {
        el.setAttribute('height', String(Math.round(finalHeightPx)));
      }
      el.style.margin = '8pt 0';
      el.style.pageBreakInside = 'avoid';
      el.style.breakInside = 'avoid';
      preparedWordImages++;
    });

    console.debug('[DOCX Export] Prepared image dimensions', { preparedWordImages });

    tempDiv.querySelectorAll('table').forEach((el) => {
      el.style.marginTop = '8pt';
      el.style.marginBottom = '8pt';
      el.style.pageBreakInside = 'auto';
      el.style.breakInside = 'auto';
    });

    tempDiv.querySelectorAll('p, div, section, article, figure, table, ul, ol').forEach((el) => {
      if (!el.style.marginTop) el.style.marginTop = '0';
      if (!el.style.marginBottom) el.style.marginBottom = '8pt';
      el.style.pageBreakBefore = 'auto';
      el.style.pageBreakAfter = 'auto';
      el.style.breakBefore = 'auto';
      el.style.breakAfter = 'auto';
    });

    return tempDiv;
  }

  function getImageExtensionFromDataUrl(dataUrl) {
    const match = /^data:image\/([a-zA-Z0-9+.-]+);/i.exec(dataUrl || "");
    if (!match) return "png";
    const extension = match[1].toLowerCase();
    if (extension === "jpg") return "jpeg";
    if (extension === "svg+xml") return "svg";
    return extension;
  }

  function dataUrlToImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  async function ensureRasterDataUrl(dataUrl, width, height) {
    const extension = getImageExtensionFromDataUrl(dataUrl);
    if (extension !== "svg") return dataUrl;

    const img = await dataUrlToImageElement(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width || img.width || 320));
    canvas.height = Math.max(1, Math.round(height || img.height || 180));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function getUrlFileName(url) {
    try {
      const parsed = new URL(url, window.location.href);
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "";
    } catch (err) {
      const clean = (url || "").split("?")[0].split("#")[0];
      const parts = clean.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1] : "";
    }
  }

  function getImageCsvSummary(node, editor) {
    const liveDoc = getLiveCanvasDoc(editor);
    const liveNode = getLiveNodeForExportNode(node, liveDoc);
    const sourceNode = liveNode || node;
    const alt = (sourceNode.getAttribute && sourceNode.getAttribute("alt")) || "";
    const title = (sourceNode.getAttribute && sourceNode.getAttribute("title")) || "";
    const src = sourceNode.currentSrc || sourceNode.src || (sourceNode.getAttribute && sourceNode.getAttribute("src")) || "";
    const fileName = src && !src.startsWith("data:") ? getUrlFileName(src) : "";
    return [alt, title, fileName].map((value) => (value || "").trim()).find(Boolean) || "Embedded image";
  }

  function getChartCsvSummary(node, editor) {
    const liveDoc = getLiveCanvasDoc(editor);
    const liveNode = getLiveNodeForExportNode(node, liveDoc);
    const sourceNode = liveNode || node;
    const chartTitle =
      (sourceNode.getAttribute && sourceNode.getAttribute("data-chart-title")) ||
      (node.getAttribute && node.getAttribute("data-chart-title")) ||
      "";
    const rawText = (sourceNode.innerText || sourceNode.textContent || "").replace(/\s+/g, " ").trim();

    if (rawText) {
      if (chartTitle && !rawText.toLowerCase().includes(chartTitle.toLowerCase())) {
        return `${chartTitle} - ${rawText}`;
      }
      return rawText;
    }

    const svgTexts = Array.from(sourceNode.querySelectorAll ? sourceNode.querySelectorAll("svg text, text") : [])
      .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (svgTexts.length) {
      const uniqueTexts = Array.from(new Set(svgTexts));
      return chartTitle
        ? `${chartTitle} - ${uniqueTexts.join(" | ")}`
        : uniqueTexts.join(" | ");
    }

    return chartTitle || node.id || "Chart";
  }

  editor.on("load", () => {
    const devicesPanel = editor.Panels.getPanel("devices-c");

    if (devicesPanel) {
      devicesPanel.get("buttons").add([{
        id: "export-plugin",
        className: "fa fa-external-link",
        command: "open-export-modal",
        attributes: { title: "Export" }
      }]);
    }
  });

  editor.Commands.add('open-export-modal', {
    run() {
      modal.setTitle('Export');
      modal.setContent(`
        <style>
          .exp-container {
            padding: 15px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }
          .exp-btn {
            padding: 10px 14px;
            border: none;
            border-radius: 8px;
            background: #4a90e2;
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            text-align: center;
          }
          .exp-btn:hover {
            background: #357abd;
            transform: translateY(-2px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          }
          .exp-spinner {
            display: none;
            justify-content: center;
            align-items: center;
            margin-top: 15px;
          }
          .exp-spinner div {
            width: 28px;
            height: 28px;
            border: 3px solid #4a90e2;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
        <div class="exp-container">
          <button class="exp-btn" data-format="txt">TXT</button>
          <button class="exp-btn" data-format="csv">CSV</button>
          <button class="exp-btn" data-format="docx">DOCX</button>
          <button class="exp-btn" data-format="rtf">RTF</button>
          <button class="exp-btn" data-format="xlsx">XLSX</button>
          <button class="exp-btn" data-format="pdf">Single Page PDF</button>
        </div>
        <div class="exp-spinner"><div></div></div>
      `);

      modal.open();

      modal.getContentEl().querySelectorAll('.exp-btn').forEach(btn => {
        btn.onclick = async () => {
          const format = btn.dataset.format;
          const spinner = modal.getContentEl().querySelector('.exp-spinner');
          spinner.style.display = 'flex';
          try {
            await exportContent(editor, format);
          } catch (e) {
          } finally {
            spinner.style.display = 'none';
          }
        };
      });
    }
  });

  async function exportContent(editor, format) {
    const iframe = editor.Canvas.getFrameEl();
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    switch (format) {
      case 'txt': return exportTXT(editor);
      case 'csv': return exportCSV(editor);
      case 'xlsx': return exportXLSX(editor);
      case 'docx': return exportDOCX(editor);
      case 'rtf': return await exportRTF(editor, doc);
      case 'pdf': return await exportPDF(doc.body);
    }
  }

  function exportTXT(editor) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = getHtmlWithCurrentFormState(editor);
    const lines = [];

    function pushLine(text) {
      if (text == null) return;
      const trimmed = String(text).replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      lines.push(trimmed);
    }

    function processNode(node) {
      if (node.nodeType === 3) {
        pushLine(node.textContent);
        return;
      }

      if (node.nodeType !== 1) return;
      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      if (tag === 'IMG') {
        pushLine(`Image: ${getImageCsvSummary(node, editor)}`);
        return;
      }

      if (isHighchartNode(node)) {
        pushLine(`Chart: ${getChartCsvSummary(node, editor)}`);
        return;
      }

      if (tag === 'TABLE') {
        const rows = node.querySelectorAll('tr');
        rows.forEach((row) => {
          const values = Array.from(row.querySelectorAll('th, td'))
            .map((cell) => (cell.innerText || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean);
          if (values.length) lines.push(values.join('\t'));
        });
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = node.querySelectorAll(':scope > li');
        items.forEach((li) => pushLine(li.innerText || li.textContent || ''));
        return;
      }

      Array.from(node.childNodes).forEach(processNode);
    }

    Array.from(tempDiv.childNodes).forEach(processNode);
    downloadFile(lines.join('\n'), 'export.txt', 'text/plain');
  }

  function isHighchartNode(node) {
    if (!node || node.nodeType !== 1) return false;
    const tag = (node.tagName || '').toUpperCase();

    if (tag === 'FIGURE' && node.getAttribute('data-i_designer-type') === 'custom_line_chart') {
      return true;
    }

    if (node.hasAttribute && node.hasAttribute('csvurl')) {
      return true;
    }

    if (node.classList && node.classList.contains && node.classList.contains('highchart-live-areaspline')) {
      return true;
    }

    return false;
  }

  async function exportCSV(editor) {
    let csvLines = [];
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = getHtmlWithCurrentFormState(editor);

    function pushTextLine(text) {
      if (text == null) return;
      const trimmed = String(text).replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      csvLines.push('"' + trimmed.replace(/"/g, '""') + '"');
    }

    function processNodeForCSV(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text && text.trim()) pushTextLine(text);
        return;
      }

      if (node.nodeType !== 1) return;
      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      if (tag === 'IMG') {
        pushTextLine(`Image: ${getImageCsvSummary(node, editor)}`);
        csvLines.push('');
        return;
      }

      if (isHighchartNode(node)) {
        pushTextLine(`Chart: ${getChartCsvSummary(node, editor)}`);
        csvLines.push('');
        return;
      }

      if (tag === 'TABLE') {
        const rows = node.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          if (cells.length === 0) return;

          const rowValues = cells.map(cell => {
            const text = cell.innerText.trim();
            return '"' + text.replace(/"/g, '""') + '"';
          }).join(',');

          csvLines.push(rowValues);
        });
        csvLines.push('');
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = node.querySelectorAll(':scope > li');
        if (items.length) {
          items.forEach(li => {
            const text = Array.from(li.childNodes).map(n => n.nodeType === 3 ? n.textContent : (n.innerText || '')).join(' ').replace(/\s+/g, ' ').trim();
            if (text) csvLines.push('"' + text.replace(/"/g, '""') + '"');
          });
          csvLines.push('');
          return;
        }
      }

      node.childNodes.forEach(child => processNodeForCSV(child));

      const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR'];
      if (blockTags.includes(tag)) {
        csvLines.push('');
      }
    }

    tempDiv.childNodes.forEach(child => processNodeForCSV(child));

    const compacted = [];
    let lastWasEmpty = false;
    csvLines.forEach(line => {
      const isEmpty = (line === '' || line == null);
      if (isEmpty && lastWasEmpty) return;
      compacted.push(isEmpty ? '' : line);
      lastWasEmpty = isEmpty;
    });

    const csv = compacted.join('\n');
    downloadFile(csv, 'export.csv', 'text/csv');
  }

  async function exportXLSX(editor) {
    if (!window.ExcelJS) {
      alert("Please include ExcelJS library!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    let nextRow = 1;
    const tempDiv = await prepareRichExportContainer(editor);

    function appendTextRow(text) {
      const trimmed = text == null ? '' : String(text).replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      sheet.getRow(nextRow).getCell(1).value = trimmed;
      nextRow++;
    }

    function appendRowArray(arr) {
      if (!arr || !arr.length) return;
      const row = sheet.getRow(nextRow);
      for (let i = 0; i < arr.length; i++) {
        row.getCell(i + 1).value = arr[i];
      }
      nextRow++;
    }

    async function appendImageNode(node) {
      const altText = (node.getAttribute('alt') || '').trim();

      try {
        let { dataUrl, width, height } = await getVisualNodeData(node, editor);
        if (!dataUrl) {
          if (altText) appendTextRow(altText);
          return;
        }

        dataUrl = await ensureRasterDataUrl(dataUrl, width, height);
        const extension = getImageExtensionFromDataUrl(dataUrl) === 'jpeg' ? 'jpeg' : 'png';
        const imageId = workbook.addImage({
          base64: dataUrl,
          extension,
        });

        const renderedWidth = Math.min(Math.max(width || 220, 120), 720);
        const renderedHeight = Math.min(Math.max(height || 140, 60), 540);
        const startRow = nextRow;
        const rowsUsed = Math.max(3, Math.ceil(renderedHeight / 20));

        sheet.addImage(imageId, {
          tl: { col: 0, row: startRow - 1 },
          ext: { width: renderedWidth, height: renderedHeight },
        });

        const rowHeightPoints = Math.max(18, Math.round(((renderedHeight / rowsUsed) * 72) / 96));
        for (let offset = 0; offset < rowsUsed; offset++) {
          sheet.getRow(startRow + offset).height = rowHeightPoints;
        }

        nextRow += rowsUsed + 1;
      } catch (err) {
        console.warn('Failed to add image to XLSX export:', err);
        if (altText) appendTextRow(altText);
      }
    }

    async function processNodeForXLSX(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text && text.trim()) appendTextRow(text);
        return;
      }
      if (node.nodeType !== 1) return;
      if (isHighchartNode(node)) return;

      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      if (tag === 'IMG') {
        await appendImageNode(node);
        return;
      }

      if (tag === 'TABLE') {
        const rows = node.querySelectorAll('tr');
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const values = [];
          let colIndex = 0;

          for (const cell of cells) {
            const text = cell.innerText.trim();
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;

            values.push(text);

            for (let i = 1; i < colspan; i++) {
              values.push('');
            }

            if (rowspan > 1) {
              const currentRow = nextRow;
              const currentCol = colIndex + 1;

              // Merge cells
              try {
                sheet.mergeCells(
                  currentRow,
                  currentCol,
                  currentRow + rowspan - 1,
                  currentCol + colspan - 1
                );
              } catch (e) {
                console.warn('Could not merge cells:', e);
              }
            }

            colIndex += colspan;
          }

          if (values.length) appendRowArray(values);
        }
        nextRow++;
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = node.querySelectorAll(':scope > li');
        if (items.length) {
          for (const li of items) {
            const text = Array.from(li.childNodes).map(n => n.nodeType === 3 ? n.textContent : (n.innerText || '')).join(' ').replace(/\s+/g, ' ').trim();
            if (text) appendTextRow(text);
          }
          nextRow++;
          return;
        }
      }

      for (const child of Array.from(node.childNodes)) {
        await processNodeForXLSX(child);
      }

      const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR'];
      if (blockTags.includes(tag)) nextRow++;
    }

    for (const child of Array.from(tempDiv.childNodes)) {
      await processNodeForXLSX(child);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    downloadFile(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      'export.xlsx'
    );
  }


  async function exportDOCX(editor) {
    if (!window.htmlDocx) {
      alert("DOCX library not loaded!");
      return;
    }

    const css = sanitizeRichExportCss(editor.getCss());
    const tempEl = await prepareWordExportContainer(editor);

    const styledHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table, td, th { border: 1px solid #000; border-collapse: collapse; }
            td, th { padding: 8px; }
            img { max-width: 375pt; }
            ${css}
            ${getRichExportStyleOverrides({ imageMaxWidthPt: 375 })}
          </style>
        </head>
        <body>
          ${tempEl.innerHTML}
        </body>
      </html>
    `;

    const blob = window.htmlDocx.asBlob(styledHtml);
    downloadFile(blob, 'export.docx');
  }

  async function convertHighchartsToPNG(html, editor) {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const chartNodes = temp.querySelectorAll(
      '[data-i_designer-type="custom_line_chart"], [csvurl], .highchart-live-areaspline'
    );

    if (chartNodes.length === 0) return temp.innerHTML;

    const liveDoc = getLiveCanvasDoc(editor);

    for (let chart of chartNodes) {
      try {
        let liveChart = getLiveNodeForExportNode(chart, liveDoc) || chart;
        if (!liveChart) continue;
        const rect = getVisualNodeSize(chart, liveChart);
        let dataUrl = "";

        const svgNode =
          (liveChart.querySelector && liveChart.querySelector('svg')) ||
          (chart.querySelector && chart.querySelector('svg')) ||
          ((liveChart.tagName || '').toUpperCase() === 'SVG' ? liveChart : null);

        if (svgNode) {
          const svgRect = getVisualNodeSize(svgNode, svgNode);
          dataUrl = await ensureRasterDataUrl(
            svgNodeToDataUrl(svgNode),
            svgRect.width || rect.width,
            svgRect.height || rect.height
          );
        }

        if (!dataUrl && window.html2canvas) {
          try {
            const canvas = await html2canvas(liveChart, {
              backgroundColor: "#ffffff",
              scale: 2,
              logging: false,
            });
            dataUrl = canvas.toDataURL("image/png");
          } catch (captureErr) {
            console.warn("Highchart html2canvas capture failed, trying SVG fallback:", captureErr);
          }
        }

        if (!dataUrl) continue;

        const img = document.createElement("img");
        img.src = dataUrl;
        img.style.width = rect.width + "px";
        img.style.height = rect.height + "px";
        img.style.display = "block";
        if (chart.id) img.id = chart.id;

        chart.parentNode.replaceChild(img, chart);
      } catch (err) {
        console.warn("Chart PNG conversion failed:", err);
      }
    }
    return temp.innerHTML;
  }

  async function exportRTF(editor) {
    const apiUrl = `${API_BASE_URL}/toRtf`;
    const css = sanitizeRichExportCss(editor.getCss());

    let overlay = document.createElement("div");
    overlay.id = "rtf-loading-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      fontSize: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    });
    overlay.innerText = "Generating RTF...";
    document.body.appendChild(overlay);

    try {
      const tempDiv = await prepareWordExportContainer(editor);
      try {
        const standardTables = tempDiv.querySelectorAll(".standard");
        standardTables.forEach(table => {
          const cells = table.querySelectorAll("th, td, div");
          cells.forEach(cell => {
            let style = cell.getAttribute("style") || "";
            style = style.replace(/height\s*:\s*100%/gi, "height:5%");
            cell.setAttribute("style", style.trim());
          });
        });
      } catch (err) {
        console.warn("⚠️ Failed during .standard table height processing:");
      }

      const classesToClean = [
        "page-container",
        "page-content",
        "header-wrapper",
        "page-header-element",
        "content-wrapper",
        "main-content-area",
        "footer-wrapper",
        "page-footer-element",
      ];
      classesToClean.forEach((cls) => {
        tempDiv.querySelectorAll(`.${cls}`).forEach((el) => {
          if (el.hasAttribute("id")) el.removeAttribute("id");
        });
      });

      const canvasResources = {
        styles: [
          "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
          "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
          "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
          "https://fonts.googleapis.com/icon?family=Material+Icons",
          "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
          "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
        ],
        scripts: [
          "https://code.jquery.com/jquery-3.3.1.slim.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
          "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
          "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
          "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
          "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
          "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
          "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
          "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
          "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
          "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
          "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
          "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js",
        ],
      };

      const externalStyles = canvasResources.styles
        .map((url) => `<link rel="stylesheet" href="${url}">`)
        .join("\n");

      const externalScripts = canvasResources.scripts
        .map((url) => `<script src="${url}" defer></script>`)
        .join("\n");

      const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${externalStyles}
        ${externalScripts}
        <style>${css} ${getRichExportStyleOverrides({ imageMaxWidthPt: 375 })}</style>
      </head>
      <body>${tempDiv.innerHTML}</body>
    </html>
    `;

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([finalHtml], { type: "text/html" }),
        "export.html"
      );

      const response = await fetch(apiUrl, { method: "POST", body: formData });
      if (!response.ok)
        throw new Error(`API Error: ${response.status} ${response.statusText}`);

      const blob = await response.blob();
      const rtfUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = rtfUrl;
      a.download = "export.rtf";
      a.click();

      URL.revokeObjectURL(rtfUrl);
    } catch (err) {
      console.error("❌ RTF Export Failed:");
      alert("RTF export failed.");
    } finally {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }


  async function exportPDF(body) {
    const apiUrl = `${API_BASE_URL}/uploadSinglePagePdf`;
    const html = getHtmlWithCurrentFormState(editor);
    const css = editor.getCss();

    let overlay = document.createElement("div");
    overlay.id = "pdf-loading-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      fontSize: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    });
    overlay.innerText = "Generating PDF...";
    document.body.appendChild(overlay);

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const classesToClean = [
        "page-container",
        "page-content",
        "header-wrapper",
        "page-header-element",
        "content-wrapper",
        "main-content-area",
        "footer-wrapper",
        "page-footer-element",
      ];
      classesToClean.forEach((cls) => {
        tempDiv.querySelectorAll(`.${cls}`).forEach((el) => {
          if (el.hasAttribute("id")) el.removeAttribute("id");
        });
      });

      try {
        tempDiv.querySelectorAll('.page-break, [class*="page-break"]').forEach(el => el.remove());
      } catch (remErr) {
        console.warn("⚠️ Error removing page-break elements:");
      }

      const canvasResources = {
        styles: [
          "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
          "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
          "https://fonts.googleapis.com/icon?family=Material+Icons",
          "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
          "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
        ],
        scripts: [
          "https://code.jquery.com/jquery-3.3.1.slim.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
          "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
          "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
          "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
          "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
          "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
          "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
          "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
          "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
          "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
          "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
          "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
        ]
      };

      const externalStyles = canvasResources.styles
        .map((url) => `<link rel="stylesheet" href="${url}">`)
        .join("\n");

      const externalScripts = canvasResources.scripts
        .map((url) => `<script src="${url}" defer></script>`)
        .join("\n");

      const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          ${externalScripts}
          <style>${sanitizeRichExportCss(css)} ${getRichExportStyleOverrides({ imageMaxWidthPt: 375 })}</style>
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;

      const formData = new FormData();
      formData.append("file", new Blob([finalHtml], { type: "text/html" }), "single_page.html");

      const response = await fetch(apiUrl, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

      const blob = await response.blob();
      const contentType = response.headers.get("Content-Type");

      if (contentType && contentType.includes("pdf")) {
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "export.pdf";
        a.click();
        URL.revokeObjectURL(pdfUrl);
      } else {
        console.warn("⚠️ Unexpected response type:");
        alert("Unexpected response from server, PDF not received.");
      }

    } catch (err) {
      console.error("❌ Error exporting PDF:");
      alert("Failed to export PDF.");
    } finally {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  }

  function downloadFile(content, filename, type) {
    let blob = content instanceof Blob ? content : new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportPlugin;
}
