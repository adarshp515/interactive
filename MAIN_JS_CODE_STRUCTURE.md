# main.js — Code Structure Map

Architecture reference for [js/main.js](js/main.js) and [index.html](index.html).  
**Purpose:** fast pinpoint navigation for AI edits — startup order, function catalog, call chains, API touchpoints.

---

## 1. Entry Point and Load Order

| File | Role |
|------|------|
| [index.html](index.html) | HTML shell, dependency loader |
| [js/main.js](js/main.js) | Runtime bootstrap, all editor logic |

### index.html Script Load Sequence

1. CSS libs in `<head>` (Bootstrap, FontAwesome, DataTables, etc.)
2. Component plugin scripts (drawingTool, customTable, jsontablecustom, etc.)
3. `div#editor` mount container at ~L94
4. `html2pdf` helper at ~L97
5. `home.js` at ~L105
6. `main.js` at ~L106 ← **all plugin globals must exist before this**

---

## 2. Editor Initialization (L2–L130)

```
window.editor = InteractiveDesigner.init({ ... })  ← L2
```

### Registered Plugins (L15–L63)

| Plugin | Type |
|--------|------|
| `drawingTool` | Drawing canvas |
| `customChartCommonJson` | Chart component |
| `customTable` | Enhanced table + formula |
| `jsontablecustom` | JSON-driven table |
| `flowLayoutComponent` | Flow layout |
| `customCarousel` | Carousel |
| `subreportPlugin` | Subreport inlining |
| `addLiveLineChartComponent` | Live line chart |
| `addFormattedRichTextComponent` | RTE |
| `addQRBarcodeComponent` | QR/Barcode |
| `registerCustomShapes` | SVG shapes |
| `customTableOfContents` | TOC |
| `backgroundMusic` | Slideshow audio |
| `exportPlugin`, `source`, `object` | Export/misc |
| `"page-manager-component"` | Multi-page manager |
| `"navbar-component"`, `"tooltip-component"` | UI chrome |
| `"image-editor-component"`, `"zip-export-component"` | Asset tools |

### Canvas CDN Scripts injected into iframe (L90–L128)

jQuery, Bootstrap, DataTables, Highcharts, moment.js, numeral.js, jsPDF, html2canvas, bwip-js, JsBarcode, QRCode, xlsx, formula-parser, html-docx-js, html-to-rtf.

---

## 3. Global State Variables

| Variable | Line | Purpose |
|----------|------|---------|
| `pageManager` | L197 | Reference to Pages plugin |
| `pageSetupManager` | L198 | PageSetupManager instance |
| `uploadedJsonFiles` | L418 | In-memory list of uploaded datasource files |
| `datasourceRebindTimer` | L3947 | Debounce timer for datasource rebinding |
| `slides` | L4068 | Slideshow slide array |
| `transitions` | L4069 | Per-slide transition config map |
| `clickStates` | L4070 | Per-slide click state map |
| `currentSlideIndex` | L4071 | Active slide tracker |
| `hasChanges` | L4083 | Dirty flag for beforeunload guard |

### IndexedDB Constants (L2994–L2996)

```js
DB_NAME    = 'TemplateEditorDB'
DB_VERSION = 1
STORE_NAME = 'pages'
```

---

## 4. Event and Command Map

### Editor Events

| Event | Line | Action |
|-------|------|--------|
| `component:update:name / attributes / selected` | L132 | Call `updateLayerName` |
| `layer:component` | L136 | Call `updateLayerName` |
| `component:add` | L140 | Call `updateLayerName` |
| `load` (layer init) | L144 | Walk all components, call `updateLayerName` |
| `run:open-assets` | L150 | Inject "Select from JSON" button into asset manager |
| `load` (page setup) | L200 | Wait for pageManager, init `PageSetupManager`, restore settings |
| `load` (link scan) | L3306 | Scan anchor hrefs, style same-page links |
| `load` (datasource) | L4011 | Schedule initial datasource rebind (250ms delay) |
| `component:add` | L3293 | `ensureUpDownArrowToolbar` + `enableResizeAndRotate` |
| `component:selected` | L3299 | `ensureUpDownArrowToolbar` + `enableResizeAndRotate` |
| `rte:enable` | L3963 | Restore raw template placeholders in RTE view |
| `rte:disable` | L3975 | Save edited template, schedule datasource rebind |
| `run:core:canvas-clear` | L4073 | Reset slideshow state arrays |
| `update` | L4085 | Set `hasChanges = true` |

### Toolbar Button Bindings (L392–L416)

| Element ID | Handler |
|------------|---------|
| `exportPDF` | `generatePrintDialog` |
| `savePage` | `savePage` |
| `importPage` | `importSinglePages` |
| `allTemplateList` | `viewAllTemplates` → `template.html` |
| `allLogs` | `viewAllLogsD` → `logs.html` |
| `excelCsvUpload` | `uploadExcelCsv` |

### Global Window Hooks

| Hook | Line | Purpose |
|------|------|---------|
| `window.rebindAllDatasourceComponents` | L4002 | Manual trigger for datasource rebind |
| `window.scheduleDatasourceRebind` | L4006 | Exposed debounced rebind scheduler |
| `common-json-files-updated` event | L4007 | Auto-rebind on JSON file list change |
| `beforeunload` | L4089 | Prompt user if `hasChanges` is true |

---

## 5. Function Catalog

### A) Layer / Component Identity

| Function | Line | Description |
|----------|------|-------------|
| `updateLayerRecursively(component)` | L170 | DFS walks component tree, calls `updateLayerName` on every node |
| `updateLayerName(component)` | L177 | Sets Layers panel label to `"Name #id"` using trait id if present |

---

### B) Page Setup

| Function | Line | Description |
|----------|------|-------------|
| `restorePageSetupFromTemplate(editor, mgr)` | L227 | Retries up to 10× to load `window.pageSetupSettings`; imports into PageSetupManager or reconstructs defaults from `.page-container` nodes |

---

### C) HTML Snapshot / Export-Safe DOM Capture

| Function | Line | Description |
|----------|------|-------------|
| `getHtmlWithCurrentFormState(editor)` | L420 | Clones editor HTML; syncs live canvas form state (checkbox/radio/textarea/select) and datasource attrs (`my-input-json`, `data-template-text`, `data-json-file-index`) into snapshot |
| `getPdfPreviewHtmlFromLiveCanvas(editor)` | L505 | Stronger snapshot — also copies `class`, `style`, `data-*` attrs and `innerHTML` by element id from live iframe |
| `getLegacyPdfExportHtmlSnapshot(editor)` | L562 | Legacy form-state snapshot used by PDF preview generator |
| `restoreTemplateAwareTextForBulkExport(root)` | L617 | Restores raw `data-template-text` placeholders into innerHTML before bulk export |

---

### D) Bulk Export Modal (`open-modal` command)

**Entry:** `editor.Commands.add("open-modal", ...)` at **L636**

Opens modal, builds `my-input-json` mappings from HTML attrs + CSS custom properties, allows JSON/XML datasource upload, filename/password field mapping, sends payload to API.

**Nested helpers:**

| Function | Line | Description |
|----------|------|-------------|
| `extractMetaDataKeys(obj, prefix)` | L783 | Recursively flattens object keys for dropdown population |
| `normalizeBulkDatasourceFileName(name)` | L859 | Enforces `.json` / `.xml` extension fallback |
| `isBulkModalJsonContent(str)` | L868 | Validates parsable non-null JSON object string |
| `loadStoredDatasourceFilesForBulkModal()` | L879 | Pulls datasource files from localStorage, normalizes list |
| `getMergedUploadedJsonData()` | L934 | Merges uploaded + locally stored datasource JSON objects |
| `renderUploadedJsonList()` | L954 | Renders uploaded file chips with delete action |
| `refreshLanguageDropdowns()` | L977 | Rebuilds language dropdowns from merged datasource top-level keys |
| `renderSaved()` | L1097 | Renders saved filename/password mapping rows |
| `renderPasswordCustomSaved()` | L1118 | Renders custom password field with delete |

---

### E) Conversion and Export API

| Function | Line | Description |
|----------|------|-------------|
| `htmlWithCss(html, css)` | L1193 | Wraps html + css into full `<!DOCTYPE html>` string |
| `getFilenameFromResponse(response, fallback)` | L1207 | Extracts filename from `Content-Disposition` response header |
| `convertXmlToJson(xmlContent, fileName)` | L1218 | Lazy-loads X2JS, converts XML → normalized JSON; returns `{json, jsonString}` |
| `normalizeXMLtoJSON(obj)` *(nested)* | L1231 | Canonicalizes X2JS output into clean arrays/primitives |
| `performConversion()` *(nested)* | L1292 | Executes X2JS parse + normalization |
| `exportDesignAndSend(editor, mappings)` | L1313 | Builds final HTML, appends datasource files + payload to FormData, POSTs to `/uploadPdf` or `/uploadHtml`, triggers zip download |

---

### F) PDF Preview and Generation Engine

**Main orchestrator:** `generatePrintDialog()` at **L1527**

Opens preview modal, filters pages, expands subreports, paginates content, renders preview iframe, sends final HTML to `/uploadHtmlToPdf`.

**Nested helpers inside `generatePrintDialog`:**

| Function | Line | Description |
|----------|------|-------------|
| `expandSubreports(htmlString)` | L1690 | Resolves `.subreport-container` elements from API and inlines their pages |
| `applyTableFilter(table, col, val)` | L1816 | Row-level table filtering by column/value |
| `getFilteredHtml(html, mode, custom)` | L1852 | Keeps selected pages (all / odd / even / custom range) |
| `buildExportDatasourceBootstrapScript()` | L1894 | Injects script to restore localStorage datasource context in exported HTML |
| `buildFinalHtml(pages, css, scripts)` | L1981 | Merges styles/scripts/content, removes editor artifacts, sets pagination script and datasource bootstrap |
| `areChartsReady(doc)` | L2090 | Checks if all Highcharts in a document are rendered |
| `waitForChartsBeforePagination(timeout)` | L2110 | Polls chart readiness before triggering pagination |
| `paginatePreview(doc)` | L2149 | Splits content into pages, triggers chart wait, fires page split lifecycle |
| `extractPageSettings(pageEl)` | L2314 | Reads watermark / page-number / background settings from a template page |
| `applyPageSettings(page, settings, idx)` | L2359 | Applies page styling, watermark, page-number to each produced page |
| `extractTableRows(tableEl)` | L2403 | Finds table row structures including subreport tables |
| `splitTableIntoPages(table, pageH)` | L2445 | Paginates long tables with repeated headers/footers |
| `splitIntoPages(el, pageH)` | L2532 | Generic vertical-chunk pagination for non-table content |
| `createNewPage(template)` | L2576 | Clones page template with cleared main-content-area |
| `clonePageDecoration(page)` | L2586 | Copies watermark/page-number decoration and style |
| `updatePreview(mode, custom)` | L2695 | Rebuilds iframe preview HTML for selected page mode |
| `waitForPreviewIframeReady(iframe)` | L2723 | Waits for iframe load + chart readiness before capture |
| `getRenderedPreviewHtml(iframe)` | L2753 | Captures fully rendered iframe DOM as HTML string |
| `mergeRenderedChartsIntoExportHtml(preview, src)` | L2764 | Copies rendered chart DOM from preview iframe into export HTML |

---

### G) IndexedDB and Saved Page Restoration

| Function | Line | Description |
|----------|------|-------------|
| `openDB()` | L2998 | Opens / creates `TemplateEditorDB` with `pages` object store |
| `loadFromIndexedDB(key)` | L3014 | Reads a key from the `pages` store |
| *(IIFE load)* | L3025 | On startup: loads `"single-page"` from IndexedDB and calls `applyImportedSinglePage` if found |

---

### H) Slideshow State — Snapshot and Restore

| Function | Line | Description |
|----------|------|-------------|
| `getInteractiveSlideshowSettingsSnapshot()` | L3035 | Reads slide transitions, audio, thumbnail state from component attrs and `window.transitions` |
| `buildInteractiveSlideshowSettingsScript()` | L3086 | Serializes slideshow settings into a `<script type="application/json">` tag |
| `extractSavedPageImportPayload(rawHtml)` | L3096 | Parses imported HTML into `{bodyHtml, cssText, slideshowSettings}` |
| `scheduleInteractiveSlideshowRestore(reason, delay)` | L3126 | Delayed call to `window.restoreInteractiveSlideshow` |
| `applyImportedSinglePage(rawHtml, reason, opts)` | L3138 | Applies imported HTML/CSS/components, rebinds datasource, restores slideshow, re-executes embedded scripts |

---

### I) Save / Import Page Flows

| Function | Line | Description |
|----------|------|-------------|
| `savePage()` | L3182 | Opens modal for page name input; wires `downloadPage` on confirm |
| `downloadPage()` | L3197 | Builds downloadable HTML (CSS + slideshow payload + navbar script), stores session copy, downloads `.html` file |
| `importSinglePages()` | L3352 | Opens modal to pick a single `.html` page file |
| `importFile()` | L3367 | Reads selected html file and routes through `applyImportedSinglePage` |
| `importMultipleFiles()` | L3382 | Reads JSON multi-page payload files; restores html/css/traits into editor |

---

### J) Component Behavior Utilities

| Function | Line | Description |
|----------|------|-------------|
| `ensureUpDownArrowToolbar(component)` | L3262 | Removes `tlb-arrow-down` from component toolbar |
| `enableResizeAndRotate(component)` | L3273 | Forces `draggable`, `resizable` (all 8 handles), and `rotator` on every component |
| *(link scan — load hook)* | L3306 | On load: styles same-page anchor links as plain text; clears style for external links |

---

### K) Datasource Binding and Template Text Engine

**Low-level parsing:**

| Function | Line | Description |
|----------|------|-------------|
| `cleanDatasourceStyleValue(value)` | L3433 | Trims and strips quotes from CSS custom property values |
| `parseDatasourceBindingsFromCss(cssText)` | L3439 | Extracts `my-input-json` + `json-file-index` bindings from CSS blocks by element id |
| `getStoredJsonFileNames()` | L3461 | Reads `common_json_files` from localStorage; falls back to deriving from keys |
| `getJsonDataByFileIndex(index)` | L3481 | Returns parsed JSON object for a given file index |

**Template placeholder helpers:**

| Function | Line | Description |
|----------|------|-------------|
| `hasDatasourceTemplatePlaceholders(str)` | L3514 | Returns true if string contains `{{...}}` tokens |
| `encodeDatasourceTemplateText(str)` | L3518 | Base64-encodes template text for attr storage |
| `decodeDatasourceTemplateText(str)` | L3522 | Decodes stored template text |
| `getComponentTemplateText(component)` | L3530 | Gets decoded `data-template-text` attr value |
| `setComponentTemplateText(component, text)` | L3547 | Encodes and sets `data-template-text` attr |
| `getComponentTemplateSource(component)` | L3574 | Returns raw `data-template-text` attr |
| `isTemplateAwareTextComponent(component)` | L3584 | Returns true if component uses template placeholder binding |

**Datasource path resolution:**

| Function | Line | Description |
|----------|------|-------------|
| `getDatasourcePathTokens(path)` | L3589 | Splits datasource dot-path into token segments |
| `getValueByDatasourcePath(obj, path)` | L3602 | Resolves a dot-path against a JSON object |
| `resolveValueFromDatasource(path, data)` | L3616 | Full resolution including array index and nested paths |
| `getPlaceholderTokensFromPath(path)` | L3639 | Extracts all `{{token}}` placeholders from a template path |
| `getPlaceholderTokenFromPath(path)` | L3681 | Returns single placeholder token |

**Component binding state and application:**

| Function | Line | Description |
|----------|------|-------------|
| `getComponentDatasourceState(component, css)` | L3685 | Reads `jsonPath` + `jsonFileIndex` from component attrs or CSS bindings |
| `persistDatasourceStateToAttrs(component, path, idx)` | L3709 | Writes resolved path/index back into component attrs |
| `resolveTextContentFromDatasource(component, path, data)` | L3726 | Resolves template or plain value from datasource JSON |
| `applyResolvedTextContent(component, content)` | L3764 | Sets resolved text into component model |
| `walkComponentTree(wrapper, cb)` | L3790 | DFS walk over full component tree calling `cb` for each |
| `reapplyJsonTablePreviewState(component)` | L3800 | Re-triggers json-table render from stored state |
| `hasRenderableJsonTableState(component)` | L3828 | Returns true if component has a valid json-table state to render |
| `updateComponentsWithNewJson(editor)` | L3842 | Main rebind: walks all components, resolves datasource state, applies text/chart/table updates |
| `scheduleDatasourceRebind(reason, delay)` | L3949 | Debounced wrapper (default 150ms) around `updateComponentsWithNewJson` |

---

### L) Excel/CSV Upload

| Function | Line | Description |
|----------|------|-------------|
| `uploadExcelCsv()` | L4015 | Opens modal for `.csv`/`.xlsx` file; POSTs to `${API_BASE_URL_Video}/excel/upload`; stores `uploadedFileId` + `uploadedFileName` in localStorage |

---

## 6. API Touchpoints

| Endpoint | Line | Triggered By |
|----------|------|--------------|
| `${API_BASE_URL}/uploadPdf` | L1316 | `exportDesignAndSend` — bulk PDF export |
| `${API_BASE_URL}/uploadHtml` | L1317 | `exportDesignAndSend` — bulk HTML export |
| `${API_BASE_URL}/uploadHtmlToPdf` | L1528 | `generatePrintDialog` — single PDF preview/generate |
| *(subreport template fetch)* | L1730 | `expandSubreports` — resolves subreport content from API |
| `${API_BASE_URL_Video}/excel/upload` | L4046 | `uploadExcelCsv` — uploads logic file |

---

## 7. Startup Call Chains

### Chain A — App Startup
```
L2    editor = InteractiveDesigner.init(...)
L144  editor.on('load') → updateLayerName on all components
L200  editor.on('load') → waitForPageManager → PageSetupManager init
L227  restorePageSetupFromTemplate (called after 1000ms)
L3306 editor.on('load') → scanLinks (anchor styling)
L4011 editor.on('load') → scheduleDatasourceRebind("editor-load", 250)
L3025 IIFE → loadFromIndexedDB("single-page") → applyImportedSinglePage
```

### Chain B — Bulk Export
```
L636  editor.Commands.run("open-modal")
        → builds mappingMap from HTML attrs + CSS
        → modal collects datasource files, filename/password mappings
L1313 exportDesignAndSend(editor, mappings)
        → getHtmlWithCurrentFormState → buildFinalHtml
        → FormData POST → zip download
```

### Chain C — PDF Preview / Export
```
L392  #exportPDF click → generatePrintDialog()
L1527 generatePrintDialog()
  L1620 getLegacyPdfExportHtmlSnapshot → get page containers
  L1690 expandSubreports → inline subreport content
  L1852 getFilteredHtml → apply page selection (all/odd/even/custom)
  L1981 buildFinalHtml → merge styles + scripts + datasource bootstrap
  L2695 updatePreview → load into preview iframe
  L2110 waitForChartsBeforePagination → areChartsReady polling
  L2149 paginatePreview → splitTableIntoPages / splitIntoPages
  L2764 mergeRenderedChartsIntoExportHtml → chart DOM transfer
  L1528 POST to /uploadHtmlToPdf → PDF blob download
```

### Chain D — Datasource Update and UI Rebind
```
L4007 window event "common-json-files-updated"
  OR
L4002 window.rebindAllDatasourceComponents(reason)
  OR
L3963/3975 rte:enable / rte:disable → template save + trigger
  ↓
L3949 scheduleDatasourceRebind(reason, delay)
  ↓ (debounced)
L3842 updateComponentsWithNewJson(editor)
  L3790 walkComponentTree
    → getComponentDatasourceState (attrs + CSS)
    → resolveTextContentFromDatasource / updateFromJsonPath / handleJsonPathChange
    → applyResolvedTextContent / reapplyJsonTablePreviewState
```

### Chain E — Single Page Save / Import
```
Save:
  L394  #savePage click → savePage()
  L3182 savePage() → modal → downloadPage()
  L3197 downloadPage() → builds full HTML + slideshow + navbar scripts
         → sessionStorage + file download

Import:
  L398  #importPage click → importSinglePages()
  L3352 importSinglePages() → modal → importFile()
  L3367 importFile() → FileReader → applyImportedSinglePage()
  L3138 applyImportedSinglePage()
         → extractSavedPageImportPayload (bodyHtml, cssText, slideshowSettings)
         → editor.setStyle + editor.setComponents
         → scheduleDatasourceRebind
         → scheduleInteractiveSlideshowRestore (if slides detected)
         → re-execute embedded scripts
```

---

## 8. Fast Edit Navigation Recipes

| Goal | Jump To |
|------|---------|
| Chart render in exported PDF | L2753, L2764, L2090 |
| Bulk export payload mapping + modal UX | L636, L1172 |
| Page selection filtering for PDF | L1852 |
| Pagination splitting logic | L2149, L2445, L2532 |
| Datasource text placeholders not rebinding | L3726, L3842, L3949 |
| Single-page import/export issues | L3138, L3197, L3367 |
| Subreport expansion | L1690 |
| Slideshow settings save/restore | L3035, L3086, L3126, L3138 |
| IndexedDB template auto-load | L3025 |
| RTE template placeholder preservation | L3963, L3975 |
| Link styling (same-page anchors) | L3306 |
| Component resize/rotate behavior | L3273, L3293 |
| Excel/CSV logic file upload | L4015 |

---

## 9. Notes for AI Agents Doing Surgical Edits

- **Most side-effect-heavy code** lives inside `generatePrintDialog` (L1527) and the `open-modal` command (L636). Many helpers are **nested closures** inside those two functions — scope matters when patching.
- **Datasource correctness** depends on both HTML element attrs (`my-input-json`, `data-json-file-index`) **and** CSS custom properties parsed via `parseDatasourceBindingsFromCss`. Changing one without the other will break rebinding.
- **Template text components** use `data-template-text` (base64-encoded). Always use `encodeDatasourceTemplateText` / `decodeDatasourceTemplateText` — never read/write the attr raw.
- **PDF chart stability** depends on `areChartsReady` + `waitForChartsBeforePagination` polling order. Do not reorder the chart merge step relative to pagination.
- **Slideshow settings** are serialized as a `<script type="application/json" id="interactive-designer-slideshow-settings">` tag embedded in saved HTML. `extractSavedPageImportPayload` must strip it before passing body HTML to `editor.setComponents`.
- **`applyImportedSinglePage`** is the single entry point for all page load paths (IndexedDB restore, file import, drag-drop). Patch there rather than at individual callers.
- **Datasource rebind is always debounced** via `scheduleDatasourceRebind`. Never call `updateComponentsWithNewJson` directly from event handlers — always go through the scheduler to avoid overlapping traversals.
