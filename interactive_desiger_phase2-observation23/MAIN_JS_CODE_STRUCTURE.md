# Main.js Code Structure Map for Fast AI Navigation

This document is a full architecture map of the runtime defined by [index.html](index.html) and [js/main.js](js/main.js).

Goal: enable fast pinpoint edits by showing startup order, logic graph, function responsibilities, and direct line-level jump links.

## 1) Entry Files and Load Order

- HTML entry: [index.html](index.html)
- Runtime bootstrap: [js/main.js](js/main.js)

### index.html dependency order

1. Loads CSS and base libs in head, then component scripts.
2. Mount container is [index.html](index.html#L94): div id="editor".
3. Loads html2pdf helper at [index.html](index.html#L97).
4. Loads home runtime and final bootstrap scripts last:
- [index.html](index.html#L105) for home.js
- [index.html](index.html#L106) for main.js

This means all component plugin globals must exist before main.js runs.

## 2) High-Level Runtime Graph

Flow graph of whole system:

START
  -> index.html loads all plugin/component scripts
  -> main.js creates InteractiveDesigner editor instance
  -> editor load events register and initialize subsystems
     -> Layer naming pipeline
     -> Page setup manager initialization and restore
     -> Toolbar/panel button bindings
     -> DataSource rebind scheduling
     -> Link style scan and resize/rotate behavior
  -> User actions branch
     -> Export PDF preview flow
     -> Bulk export modal flow (PDF/HTML)
     -> Save/Import single page flow
     -> Upload excel/csv logic file
     -> Asset manager JSON image selector
  -> DataSource updates branch
     -> Rebind all mapped components
     -> Repaint charts/json-table/text templates
  -> Before unload guard if editor changed
END

## 3) Core State and Global Variables

Primary global editor and state objects:

- Editor instance creation: [js/main.js](js/main.js#L1)
- Page manager holders:
- [js/main.js](js/main.js#L197) pageManager
- [js/main.js](js/main.js#L198) pageSetupManager
- Uploaded bulk datasource files: [js/main.js](js/main.js#L418)
- IndexedDB constants:
- [js/main.js](js/main.js#L2994) DB_NAME
- [js/main.js](js/main.js#L2995) DB_VERSION
- [js/main.js](js/main.js#L2996) STORE_NAME
- Slideshow runtime state:
- [js/main.js](js/main.js#L4068) slides
- [js/main.js](js/main.js#L4069) transitions
- [js/main.js](js/main.js#L4070) clickStates
- [js/main.js](js/main.js#L4071) currentSlideIndex
- Unsaved changes flag:
- [js/main.js](js/main.js#L4083) hasChanges

## 4) Event and Command Map

Main event hooks and command entrypoints:

- Component/layer naming updates:
- [js/main.js](js/main.js#L132)
- [js/main.js](js/main.js#L136)
- [js/main.js](js/main.js#L140)
- [js/main.js](js/main.js#L144)
- Asset manager open hook for JSON image selector:
- [js/main.js](js/main.js#L150)
- Page setup init on editor load:
- [js/main.js](js/main.js#L200)
- Bulk modal command registration:
- [js/main.js](js/main.js#L636)
- PDF button flow:
- [js/main.js](js/main.js#L392)
- [js/main.js](js/main.js#L2970)
- RTE template-safe handlers:
- [js/main.js](js/main.js#L3963)
- [js/main.js](js/main.js#L3975)
- Datasource auto-rebind load hook:
- [js/main.js](js/main.js#L4011)
- Canvas clear slideshow reset:
- [js/main.js](js/main.js#L4073)
- Change tracking:
- [js/main.js](js/main.js#L4085)

## 5) Function Catalog with Definitions

Important means high fan-in, external side effects, state mutation, API/IO, export/render path, or datasource rebinding.

### A) Layer and component identity

- updateLayerRecursively at [js/main.js](js/main.js#L170)
- Definition: DFS walk of component tree to refresh display name for each node.
- updateLayerName at [js/main.js](js/main.js#L177)
- Definition: sets layer label to Name #id using trait id if present; catches Layers API errors.

### B) Page setup restoration

- restorePageSetupFromTemplate at [js/main.js](js/main.js#L227)
- Definition: retries loading window.pageSetupSettings, imports into PageSetupManager if valid, else reconstructs defaults from existing .page-container nodes.

### C) HTML snapshot and export-safe DOM capture

- getHtmlWithCurrentFormState at [js/main.js](js/main.js#L420)
- Definition: clones editor HTML and copies live canvas form state (checkbox/radio/textarea/select plus datasource attrs) into export snapshot.
- getPdfPreviewHtmlFromLiveCanvas at [js/main.js](js/main.js#L505)
- Definition: stronger snapshot for preview, including classes/styles/data attrs and innerHTML by id.
- getLegacyPdfExportHtmlSnapshot at [js/main.js](js/main.js#L562)
- Definition: legacy snapshot used by PDF preview generator.
- restoreTemplateAwareTextForBulkExport at [js/main.js](js/main.js#L617)
- Definition: restores unresolved template placeholders from data-template-text before bulk export.

### D) Bulk export modal subsystem

Entry command:

- open-modal command at [js/main.js](js/main.js#L636)
- Definition: opens bulk modal, builds field mappings, allows JSON/XML file upload, filename/password mapping, sends payload.

Nested helpers in this command:

- extractMetaDataKeys at [js/main.js](js/main.js#L783)
- Definition: recursively flattens object keys for dropdowns.
- normalizeBulkDatasourceFileName at [js/main.js](js/main.js#L859)
- Definition: enforces .json/.xml extension fallback.
- isBulkModalJsonContent at [js/main.js](js/main.js#L868)
- Definition: validates parsable non-null JSON object string.
- loadStoredDatasourceFilesForBulkModal at [js/main.js](js/main.js#L879)
- Definition: pulls datasource files from localStorage keys and normalizes list.
- getMergedUploadedJsonData at [js/main.js](js/main.js#L934)
- Definition: merges uploaded/local datasource JSON objects.
- renderUploadedJsonList at [js/main.js](js/main.js#L954)
- Definition: UI render for uploaded file chips with delete action.
- refreshLanguageDropdowns at [js/main.js](js/main.js#L977)
- Definition: rebuilds language dropdowns from merged datasource top-level keys.
- renderSaved at [js/main.js](js/main.js#L1097)
- Definition: renders saved file-name/password mapping items.
- renderPasswordCustomSaved at [js/main.js](js/main.js#L1118)
- Definition: renders custom password with delete.

### E) Conversion and export API path

- htmlWithCss at [js/main.js](js/main.js#L1193)
- Definition: wraps html+css into full HTML skeleton string.
- getFilenameFromResponse at [js/main.js](js/main.js#L1207)
- Definition: extracts filename from Content-Disposition header.
- convertXmlToJson at [js/main.js](js/main.js#L1218)
- Definition: lazy-loads X2JS if needed, converts XML to normalized JSON, returns object and jsonString.
- normalizeXMLtoJSON nested at [js/main.js](js/main.js#L1231)
- Definition: canonicalize X2JS structure into arrays/primitives.
- performConversion nested at [js/main.js](js/main.js#L1292)
- Definition: executes parse + normalization.
- exportDesignAndSend at [js/main.js](js/main.js#L1313)
- Definition: builds final HTML for bulk export, appends datasource files and payload to FormData, calls uploadPdf or uploadHtml endpoint, triggers zip download.

### F) PDF preview and generation engine

Main orchestrator:

- generatePrintDialog at [js/main.js](js/main.js#L1527)
- Definition: opens preview modal, filters pages, expands subreports, paginates content, renders preview iframe, sends final HTML to uploadHtmlToPdf endpoint.

Nested helpers in PDF engine:

- expandSubreports at [js/main.js](js/main.js#L1690)
- Definition: resolves subreport templates from API and inlines content/pages.
- applyTableFilter at [js/main.js](js/main.js#L1816)
- Definition: row-level table filtering by column/value.
- getFilteredHtml at [js/main.js](js/main.js#L1852)
- Definition: keeps selected pages (all/odd/even/custom).
- buildExportDatasourceBootstrapScript at [js/main.js](js/main.js#L1894)
- Definition: injects script to restore localStorage datasource context in exported HTML.
- buildFinalHtml at [js/main.js](js/main.js#L1981)
- Definition: merges styles/scripts/content, removes print-only artifacts, sets pagination script and datasource bootstrap.
- areChartsReady at [js/main.js](js/main.js#L2090)
- waitForChartsBeforePagination at [js/main.js](js/main.js#L2110)
- paginatePreview at [js/main.js](js/main.js#L2149)
- Definition: chart readiness and final page split/pagination lifecycle.
- extractPageSettings at [js/main.js](js/main.js#L2314)
- Definition: reads watermark/page number/background settings from template page.
- applyPageSettings at [js/main.js](js/main.js#L2359)
- Definition: applies page styling/watermark/page-number to each produced page.
- extractTableRows at [js/main.js](js/main.js#L2403)
- Definition: finds table row structures including subreport tables.
- splitTableIntoPages at [js/main.js](js/main.js#L2445)
- Definition: paginates long table content with repeated headers/footers.
- splitIntoPages at [js/main.js](js/main.js#L2532)
- Definition: generic vertical chunk pagination for non-table content.
- createNewPage at [js/main.js](js/main.js#L2576)
- Definition: utility clone with cleared main-content-area.
- clonePageDecoration at [js/main.js](js/main.js#L2586)
- Definition: copies watermark/page number decoration and style.
- updatePreview at [js/main.js](js/main.js#L2695)
- Definition: rebuilds iframe preview HTML per selected page mode.
- waitForPreviewIframeReady at [js/main.js](js/main.js#L2723)
- Definition: waits for iframe + charts readiness before capture.
- getRenderedPreviewHtml at [js/main.js](js/main.js#L2753)
- Definition: captures fully rendered iframe DOM.
- mergeRenderedChartsIntoExportHtml at [js/main.js](js/main.js#L2764)
- Definition: copies rendered chart DOM from preview into source export HTML.

### G) IndexedDB and saved page restoration

- openDB at [js/main.js](js/main.js#L2998)
- Definition: opens/creates TemplateEditorDB pages store.
- loadFromIndexedDB at [js/main.js](js/main.js#L3014)
- Definition: reads key from pages object store.
- Immediate load IIFE at [js/main.js](js/main.js#L3025)
- Definition: loads single-page and applies template if present.

### H) Interactive slideshow import/export state

- getInteractiveSlideshowSettingsSnapshot at [js/main.js](js/main.js#L3035)
- Definition: reads slide transitions/audio/thumbnail state from component attrs and window state.
- buildInteractiveSlideshowSettingsScript at [js/main.js](js/main.js#L3086)
- Definition: serializes slideshow settings into script tag payload.
- extractSavedPageImportPayload at [js/main.js](js/main.js#L3096)
- Definition: parses imported html into body/css/slideshowSettings.
- scheduleInteractiveSlideshowRestore at [js/main.js](js/main.js#L3126)
- Definition: delayed call to window.restoreInteractiveSlideshow.
- applyImportedSinglePage at [js/main.js](js/main.js#L3138)
- Definition: applies imported HTML/CSS/components, rebinds datasource, restores slideshow, executes embedded scripts.

### I) Save/import page flows

- savePage at [js/main.js](js/main.js#L3182)
- Definition: opens modal for page name input.
- downloadPage at [js/main.js](js/main.js#L3197)
- Definition: builds downloadable HTML (with CSS + slideshow payload + navbar script), stores session copy, downloads file.
- importSinglePages at [js/main.js](js/main.js#L3352)
- Definition: opens modal to pick a single html page file.
- importFile at [js/main.js](js/main.js#L3367)
- Definition: reads selected html and routes through applyImportedSinglePage.
- importMultipleFiles at [js/main.js](js/main.js#L3382)
- Definition: imports JSON multi-page payload and restores html/css/traits.

### J) Datasource binding and template text engine

Low-level parsing:

- cleanDatasourceStyleValue at [js/main.js](js/main.js#L3433)
- parseDatasourceBindingsFromCss at [js/main.js](js/main.js#L3439)
- getStoredJsonFileNames at [js/main.js](js/main.js#L3461)
- getJsonDataByFileIndex at [js/main.js](js/main.js#L3481)

Template helpers:

- hasDatasourceTemplatePlaceholders at [js/main.js](js/main.js#L3514)
- encodeDatasourceTemplateText at [js/main.js](js/main.js#L3518)
- decodeDatasourceTemplateText at [js/main.js](js/main.js#L3522)
- getComponentTemplateText at [js/main.js](js/main.js#L3530)
- setComponentTemplateText at [js/main.js](js/main.js#L3547)
- getComponentTemplateSource at [js/main.js](js/main.js#L3574)
- isTemplateAwareTextComponent at [js/main.js](js/main.js#L3584)

Datasource path resolution:

- getDatasourcePathTokens at [js/main.js](js/main.js#L3589)
- getValueByDatasourcePath at [js/main.js](js/main.js#L3602)
- resolveValueFromDatasource at [js/main.js](js/main.js#L3616)
- getPlaceholderTokensFromPath at [js/main.js](js/main.js#L3639)
- getPlaceholderTokenFromPath at [js/main.js](js/main.js#L3681)

Component binding state and application:

- getComponentDatasourceState at [js/main.js](js/main.js#L3685)
- persistDatasourceStateToAttrs at [js/main.js](js/main.js#L3709)
- resolveTextContentFromDatasource at [js/main.js](js/main.js#L3726)
- applyResolvedTextContent at [js/main.js](js/main.js#L3764)
- walkComponentTree at [js/main.js](js/main.js#L3790)
- reapplyJsonTablePreviewState at [js/main.js](js/main.js#L3800)
- hasRenderableJsonTableState at [js/main.js](js/main.js#L3828)
- updateComponentsWithNewJson at [js/main.js](js/main.js#L3842)
- scheduleDatasourceRebind at [js/main.js](js/main.js#L3949)

RTE integration and global hooks:

- rte enable hook: [js/main.js](js/main.js#L3963)
- rte disable hook: [js/main.js](js/main.js#L3975)
- global manual hook window.rebindAllDatasourceComponents at [js/main.js](js/main.js#L4007)
- event common-json-files-updated at [js/main.js](js/main.js#L4008)
- load-time schedule call at [js/main.js](js/main.js#L4011)

### K) Other UX/utility subsystems

- uploadExcelCsv at [js/main.js](js/main.js#L4015)
- Definition: uploads csv/xlsx to API_BASE_URL_Video excel/upload and stores uploaded file metadata in localStorage.
- ensureUpDownArrowToolbar at [js/main.js](js/main.js#L3262)
- Definition: removes down-arrow toolbar action.
- enableResizeAndRotate at [js/main.js](js/main.js#L3273)
- Definition: enforces draggable/resizable/rotatable traits on components.
- Link scan logic in load hook at [js/main.js](js/main.js#L3306)
- Definition: styles same-page anchors as plain text if target exists within same page-container.

## 6) API Touchpoints

All backend calls in main.js:

- Bulk export PDF/HTML:
- [js/main.js](js/main.js#L1316)
- Upload HTML to PDF:
- [js/main.js](js/main.js#L1528)
- Subreport template fetch:
- [js/main.js](js/main.js#L1730)
- Excel/CSV upload logic:
- [js/main.js](js/main.js#L4040)

## 7) Fast Edit Navigation Recipes

If you need to change a specific behavior, jump here first:

- Graph/chart render in exported PDF:
- [js/main.js](js/main.js#L2753)
- [js/main.js](js/main.js#L2764)
- [js/main.js](js/main.js#L2090)
- Bulk export payload mapping and modal UX:
- [js/main.js](js/main.js#L636)
- [js/main.js](js/main.js#L1172)
- Page selection filtering for PDF:
- [js/main.js](js/main.js#L1852)
- Pagination splitting logic:
- [js/main.js](js/main.js#L2149)
- [js/main.js](js/main.js#L2445)
- [js/main.js](js/main.js#L2532)
- Datasource text placeholders not rebinding:
- [js/main.js](js/main.js#L3726)
- [js/main.js](js/main.js#L3842)
- [js/main.js](js/main.js#L3949)
- Single-page import/export issues:
- [js/main.js](js/main.js#L3138)
- [js/main.js](js/main.js#L3197)
- [js/main.js](js/main.js#L3367)

## 8) Startup-to-Action Call Chains

### Chain A: App startup

1. Editor created at [js/main.js](js/main.js#L1).
2. Load hooks fire at [js/main.js](js/main.js#L144), [js/main.js](js/main.js#L200), [js/main.js](js/main.js#L3306), [js/main.js](js/main.js#L4011).
3. Page manager restored via [js/main.js](js/main.js#L227).
4. Datasource rebinding scheduled by [js/main.js](js/main.js#L3949).

### Chain B: Bulk export

1. User runs command at [js/main.js](js/main.js#L636).
2. Modal collects mappings/files.
3. Send button calls [js/main.js](js/main.js#L1313).
4. FormData posted and zip download triggered.

### Chain C: PDF preview/export

1. Click handler triggers [js/main.js](js/main.js#L1527).
2. Preview builds filtered html via [js/main.js](js/main.js#L1852).
3. Final html built by [js/main.js](js/main.js#L1981).
4. Charts merged by [js/main.js](js/main.js#L2764).
5. API call returns PDF blob and download starts.

### Chain D: Datasource update and UI rebinding

1. Event/manual call schedules [js/main.js](js/main.js#L3949).
2. Traversal and rebinding executed in [js/main.js](js/main.js#L3842).
3. Text/template/json-table/chart components refreshed based on type.

## 9) Notes for AI Agents Doing Surgical Edits

- Most side-effect-heavy code lives inside generatePrintDialog and the open-modal command.
- Many helpers are nested inside those two functions, so scope matters when patching.
- Datasource correctness depends on both HTML attrs and CSS custom properties.
- For template text components, preserve data-template-text and placeholder restoration logic.
- For PDF stability, avoid changing chart readiness checks and pagination ordering unless required.

This map is intended to be a direct navigation layer over [js/main.js](js/main.js) and [index.html](index.html) so targeted edits can be made with minimal re-reading.
