function exportPlugin(editor) {
  const modal = editor.Modal;

  function decodeDatasourceTemplateText(value) {
    try {
      return decodeURIComponent(String(value == null ? "" : value));
    } catch (err) {
      return String(value == null ? "" : value);
    }
  }

  function getDatasourcePathTokens(path) {
    if (path == null) return [];

    return String(path)
      .trim()
      .replace(/\[\s*(\d+)\s*\]/g, ".${1}")
      .replace(/\[\s*['"]([^'"\]]+)['"]\s*\]/g, ".${1}")
      .replace(/^\./, "")
      .split(".")
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function getPlaceholderCandidatesFromPath(path) {
    const tokens = getDatasourcePathTokens(path);
    if (!tokens.length) return [];

    const lastNamedToken = [...tokens]
      .reverse()
      .find((token) => token && !/^\d+$/.test(String(token)));

    const candidates = [];
    if (lastNamedToken) {
      candidates.push(String(lastNamedToken));
    }

    const normalizedPath = tokens.map((token) => String(token)).join(".");
    if (normalizedPath) {
      candidates.push(normalizedPath);
    }

    const originalPath = String(path || "").trim().split(".").slice(1).join(".");
    if (originalPath) {
      candidates.push(originalPath);
    }

    return [...new Set(candidates.filter(Boolean))];
  }

  function getJsonDataByFileIndex(fileIndex) {
    const normalizedIndex = String(fileIndex == null ? "0" : fileIndex).trim() || "0";

    try {
      if (normalizedIndex !== "0") {
        const fileNames = (localStorage.getItem("common_json_files") || "")
          .split(",")
          .map((fileName) => fileName.trim())
          .filter(Boolean);

        const selectedFile = fileNames[parseInt(normalizedIndex, 10) - 1];
        const jsonString = selectedFile
          ? localStorage.getItem(`common_json_${selectedFile}`)
          : null;

        return jsonString ? JSON.parse(jsonString) : null;
      }

      const jsonString = localStorage.getItem("common_json");
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (err) {
      return null;
    }
  }

  function resolveValueFromDatasource(source, fullPath) {
    if (!source || !fullPath) return undefined;

    const tokens = getDatasourcePathTokens(fullPath);
    if (!tokens.length) return undefined;

    let remainingPath = tokens.join(".");
    let rootObject = source;

    if (tokens.length > 1 && source[tokens[0]] != null) {
      rootObject = source[tokens[0]];
      remainingPath = tokens.slice(1).join(".");
    }

    if (!remainingPath) return rootObject;

    return remainingPath.split(".").reduce((currentValue, token) => {
      if (currentValue == null) return undefined;
      return currentValue[token];
    }, rootObject);
  }

  function resolveDataBoundExportContent(liveNode) {
    const templateText = decodeDatasourceTemplateText(
      liveNode.getAttribute("data-template-text") || ""
    );
    const jsonPath = String(liveNode.getAttribute("my-input-json") || "").trim();
    const fileIndex = String(liveNode.getAttribute("data-json-file-index") || "0").trim() || "0";

    if (!templateText || !jsonPath) {
      return null;
    }

    const commonJson = getJsonDataByFileIndex(fileIndex);
    if (!commonJson) {
      return null;
    }

    const jsonPaths = jsonPath.split(",").map((path) => path.trim()).filter(Boolean);
    if (!jsonPaths.length) {
      return null;
    }

    let renderedContent = templateText;

    jsonPaths.forEach((path) => {
      const resolvedValue = resolveValueFromDatasource(commonJson, path);
      if (resolvedValue === undefined || resolvedValue === null) return;

      const placeholderTokens = getPlaceholderCandidatesFromPath(path);
      if (!placeholderTokens.length) return;

      placeholderTokens.forEach((placeholderToken) => {
        const placeholder = `{${placeholderToken}}`;
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        renderedContent = renderedContent.replace(
          new RegExp(escapedPlaceholder, "g"),
          String(resolvedValue)
        );
      });
    });

    return renderedContent;
  }

  function getHtmlWithCurrentFormState(editor) {
    const baseHtml = editor.getHtml();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = baseHtml;

    const iframe = editor.Canvas && editor.Canvas.getFrameEl ? editor.Canvas.getFrameEl() : null;
    const liveDoc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
    if (!liveDoc || !liveDoc.body) return tempDiv.innerHTML;

    const selectors = [
      'input[type="checkbox"]',
      'input[type="radio"]',
      'input:not([type="checkbox"]):not([type="radio"])',
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
        } else if (liveNode.matches('input:not([type="checkbox"]):not([type="radio"])')) {
          const liveValue = liveNode.value || "";
          exportNode.setAttribute("value", liveValue);
          exportNode.value = liveValue;
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

    const exportNodesById = new Map();
    tempDiv.querySelectorAll("[id]").forEach((node) => {
      if (node.id) {
        exportNodesById.set(node.id, node);
      }
    });

    liveDoc.body
      .querySelectorAll('[id][contenteditable="true"], [id][my-input-json], [id][data-template-text], [id][data-json-file-index]')
      .forEach((liveNode) => {
        const exportNode = exportNodesById.get(liveNode.id);
        if (!exportNode) return;

        [
          "my-input-json",
          "data-template-text",
          "data-json-file-index",
          "data-gjs-type",
          "data-i_designer-type",
          "contenteditable",
        ].forEach((attrName) => {
          if (liveNode.hasAttribute(attrName)) {
            exportNode.setAttribute(attrName, liveNode.getAttribute(attrName) || "");
          }
        });

        if (
          liveNode.hasAttribute("contenteditable") ||
          liveNode.hasAttribute("data-template-text") ||
          liveNode.hasAttribute("my-input-json")
        ) {
          exportNode.innerHTML =
            resolveDataBoundExportContent(liveNode) || liveNode.innerHTML;
        }
      });

    if (typeof window.syncFlowLayoutsFromLiveDoc === "function") {
      window.syncFlowLayoutsFromLiveDoc(tempDiv, liveDoc.body);
    }

    return tempDiv.innerHTML;
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
      case 'txt': return exportTXT(doc);
      case 'csv': return exportCSV(doc);
      case 'xlsx': return exportXLSX(editor, doc);
      case 'docx': return exportDOCX(editor);
      case 'rtf': return await exportRTF(editor, doc);
      case 'pdf': return await exportPDF(doc.body);
    }
  }

  function exportTXT(doc) {
    const text = doc.body.innerText;
    downloadFile(text, 'export.txt', 'text/plain');
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

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function parseImageDataUrl(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i);
    if (!match) return null;

    const mime = match[1].toLowerCase();
    if (mime.includes('png')) return { mime, extension: 'png' };
    if (mime.includes('jpeg') || mime.includes('jpg')) return { mime, extension: 'jpeg' };
    if (mime.includes('gif')) return { mime, extension: 'gif' };
    return null;
  }

  function parsePxValue(value) {
    if (value == null) return 0;
    const asString = String(value).trim();
    if (!asString) return 0;
    const parsed = parseFloat(asString.replace('px', ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getImageDimensions(node, fallbackWidth = 420, fallbackHeight = 240) {
    const style = node && node.style ? node.style : {};
    const width =
      parsePxValue(style.width) ||
      parsePxValue(node?.getAttribute?.('width')) ||
      parsePxValue(node?.width) ||
      fallbackWidth;

    const height =
      parsePxValue(style.height) ||
      parsePxValue(node?.getAttribute?.('height')) ||
      parsePxValue(node?.height) ||
      fallbackHeight;

    return {
      width: Math.max(80, Math.round(width)),
      height: Math.max(40, Math.round(height)),
    };
  }

  function areChartsReadyInDocument(liveDoc) {
    if (!liveDoc || !liveDoc.body) return true;

    const chartSelector = '[data-i_designer-type="custom_line_chart"], [csvurl], .highchart-live-areaspline';
    const charts = Array.from(liveDoc.body.querySelectorAll(chartSelector));
    if (!charts.length) return true;

    return charts.every((chart) => {
      const text = (chart.textContent || '').trim();
      if (/Failed to load chart library|Chart could not be rendered/i.test(text)) {
        return true;
      }

      if (chart.getAttribute('data-chart-ready') === 'true') {
        return true;
      }

      return Boolean(
        chart.querySelector('svg, canvas, .highcharts-container, .highcharts-root')
      );
    });
  }

  async function waitForChartsBeforeSnapshot(editor, timeoutMs = 15000) {
    const iframe = editor.Canvas && editor.Canvas.getFrameEl ? editor.Canvas.getFrameEl() : null;
    const liveDoc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
    if (!liveDoc || !liveDoc.body) return;

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (areChartsReadyInDocument(liveDoc)) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  async function snapshotChartsInContainer(container, editor) {
    if (!container || !window.html2canvas) return 0;

    const iframe = editor.Canvas && editor.Canvas.getFrameEl ? editor.Canvas.getFrameEl() : null;
    const liveDoc = iframe && (iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document));
    if (!liveDoc || !liveDoc.body) return 0;

    const selector = '[data-i_designer-type="custom_line_chart"], [csvurl], .highchart-live-areaspline';
    const exportCharts = Array.from(container.querySelectorAll(selector));
    if (!exportCharts.length) return 0;

    const liveCharts = Array.from(liveDoc.body.querySelectorAll(selector));
    let convertedCount = 0;

    for (let index = 0; index < exportCharts.length; index++) {
      const exportChart = exportCharts[index];
      const liveChartById = exportChart.id ? liveDoc.getElementById(exportChart.id) : null;
      const liveChart = liveChartById || liveCharts[index] || null;
      if (!liveChart) continue;

      try {
        const rect = liveChart.getBoundingClientRect
          ? liveChart.getBoundingClientRect()
          : { width: liveChart.offsetWidth || 600, height: liveChart.offsetHeight || 320 };

        const canvas = await window.html2canvas(liveChart, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
        });

        const dataUrl = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = `${Math.max(80, Math.round(rect.width || 600))}px`;
        img.style.height = `${Math.max(40, Math.round(rect.height || 320))}px`;
        img.style.display = 'block';
        img.setAttribute('data-export-chart-image', 'true');

        if (exportChart.parentNode) {
          exportChart.parentNode.replaceChild(img, exportChart);
          convertedCount++;
        }
      } catch (err) {
        console.warn('Chart snapshot conversion failed', err);
      }
    }

    return convertedCount;
  }

  async function inlineImagesInContainer(container) {
    if (!container) return { inlinedCount: 0, failedCount: 0 };

    const images = Array.from(container.querySelectorAll('img'));
    let inlinedCount = 0;
    let failedCount = 0;

    for (const img of images) {
      try {
        const src = String(img.getAttribute('src') || '').trim();
        if (!src) {
          failedCount++;
          continue;
        }

        if (src.startsWith('data:')) {
          inlinedCount++;
          continue;
        }

        const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
        if (!response.ok) {
          throw new Error(`Image fetch failed: ${response.status}`);
        }

        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        img.setAttribute('src', dataUrl);
        inlinedCount++;
      } catch (err) {
        failedCount++;
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', 'Image could not be inlined during export');
        }
        img.setAttribute('data-export-image-inline-failed', 'true');
        console.warn('Image inline failed', err);
      }
    }

    return { inlinedCount, failedCount };
  }

  async function buildPreprocessedExportContainer(editor, options = {}) {
    const { waitForCharts = true } = options;
    const html = getHtmlWithCurrentFormState(editor);
    const container = document.createElement('div');
    container.innerHTML = html;

    if (waitForCharts) {
      await waitForChartsBeforeSnapshot(editor, 15000);
    }

    const chartsConverted = await snapshotChartsInContainer(container, editor);
    const { inlinedCount, failedCount } = await inlineImagesInContainer(container);

    return {
      container,
      chartsConverted,
      imagesInlined: inlinedCount,
      imagesFailed: failedCount,
    };
  }

  async function exportCSV(doc) {
    let csvLines = [];

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
      if (isHighchartNode(node)) return;
      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

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

    doc.body.childNodes.forEach(child => processNodeForCSV(child));

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

  async function exportXLSX(editor, doc) {
    if (!window.ExcelJS) {
      alert("Please include ExcelJS library!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    let nextRow = 1;

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

    async function addImageToSheet(imgNode) {
      let src = String(imgNode.getAttribute('src') || '').trim();
      if (!src) {
        appendTextRow('[Image missing source]');
        return;
      }

      try {
        if (!src.startsWith('data:')) {
          const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status}`);
          }
          const blob = await response.blob();
          src = await blobToDataUrl(blob);
        }

        const parsed = parseImageDataUrl(src);
        if (!parsed) {
          appendTextRow('[Image format not supported for XLSX]');
          return;
        }

        const imageId = workbook.addImage({
          base64: src,
          extension: parsed.extension,
        });

        const dimensions = getImageDimensions(imgNode, 420, 240);
        sheet.addImage(imageId, {
          tl: { col: 0, row: Math.max(0, nextRow - 1) },
          ext: { width: dimensions.width, height: dimensions.height },
        });

        const consumedRows = Math.max(2, Math.ceil(dimensions.height / 20));
        nextRow += consumedRows;
      } catch (err) {
        appendTextRow('[Image export failed]');
        console.warn('XLSX image export failed', err);
      }
    }

    async function processNodeForXLSX(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text && text.trim()) appendTextRow(text);
        return;
      }
      if (node.nodeType !== 1) return;

      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      if (isHighchartNode(node)) {
        appendTextRow('[Chart could not be converted]');
        return;
      }

      if (tag === 'IMG') {
        await addImageToSheet(node);
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

    let rootNode = doc.body;
    try {
      const preprocessed = await buildPreprocessedExportContainer(editor, { waitForCharts: true });
      rootNode = preprocessed.container;
      console.debug('[XLSX Export] charts:', preprocessed.chartsConverted, 'images inlined:', preprocessed.imagesInlined, 'images failed:', preprocessed.imagesFailed);
    } catch (err) {
      console.warn('[XLSX Export] preprocessing failed, using raw document body', err);
    }

    await processNodeForXLSX(rootNode);

    const buffer = await workbook.xlsx.writeBuffer();
    downloadFile(new Blob([buffer], { type: 'application/octet-stream' }), 'export.xlsx');
  }


  async function exportDOCX(editor) {
    if (!window.htmlDocx) {
      alert("DOCX library not loaded!");
      return;
    }

    const css = editor.getCss();
    const preprocessed = await buildPreprocessedExportContainer(editor, { waitForCharts: true });
    const tempEl = preprocessed.container;

    console.debug('[DOCX Export] charts:', preprocessed.chartsConverted, 'images inlined:', preprocessed.imagesInlined, 'images failed:', preprocessed.imagesFailed);

    const styledHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table, td, th { border: 1px solid #000; border-collapse: collapse; }
            td, th { padding: 8px; }
            img { max-width: 600px; height: auto; }
            ${css}
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

    await waitForChartsBeforeSnapshot(editor, 15000);
    await snapshotChartsInContainer(temp, editor);

    return temp.innerHTML;
  }

  async function exportRTF(editor) {
    const apiUrl = `${API_BASE_URL}/toRtf`;
    const css = editor.getCss();

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
      const preprocessed = await buildPreprocessedExportContainer(editor, { waitForCharts: true });
      const tempDiv = preprocessed.container;
      console.debug('[RTF Export] charts:', preprocessed.chartsConverted, 'images inlined:', preprocessed.imagesInlined, 'images failed:', preprocessed.imagesFailed);
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
        <style>${css}</style>
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
          <style>${css}</style>
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