# Export Rendering Pipeline

## Overview

The export pipeline converts interactive report templates into static output formats (PDF, HTML, DOCX, RTF, Excel) through a multi-stage process involving client-side capture, server-side rendering, and archive generation.

---

## Export Formats

### Supported Formats
| Format | Client-Side | Server-Side | Use Case |
|--------|-------------|-------------|----------|
| PDF | html2pdf.js (jsPDF) | Puppeteer | Final reports |
| HTML | Direct export | N/A | Web viewing |
| DOCX | html-docx-js | N/A | Word documents |
| RTF | html-to-rtf | N/A | Rich text format |
| Excel | ExcelJS | N/A | Spreadsheet data |

### Format Selection
- **PDF**: Default for print-ready reports
- **HTML**: For web viewing and editing
- **DOCX/RTF**: For word processor compatibility
- **Excel**: For tabular data export

---

## Client-Side Export

### html2pdf.js Pipeline
**Location**: `js/html2pdf.js`

#### Flow
```
1. User clicks "Export PDF"
2. generatePrintDialog() called (js/main.js L1527)
3. HTML snapshot captured
4. Form state synchronized
5. Charts frozen to images
6. html2pdf().from(html).save()
7. jsPDF generates PDF
8. Download triggered
```

#### Configuration
```javascript
html2pdf().set({
  margin: 0,
  filename: 'report.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
});
```

### ExcelJS Export
**Location**: `js/exportMultipleFormats.js`

#### Flow
```
1. Extract table data from canvas
2. Create workbook with ExcelJS
3. Add worksheet
4. Populate data
5. Generate buffer
6. Download as .xlsx
```

### DOCX/RTF Export
**Location**: `js/exportMultipleFormats.js`

#### Flow
```
1. Capture HTML content
2. Convert to DOCX (html-docx-js)
3. Generate blob
4. Download as .docx
```

---

## Server-Side Export

### Puppeteer PDF Generation
**Location**: `backend-reference/server.js`

#### Endpoint
- **POST** `/api/uploadHtmlToPdf`

#### Request
```javascript
{
  html: string,  // Complete HTML document
  options: {
    format: 'A4',
    margin: { top, right, bottom, left },
    printBackground: true
  }
}
```

#### Response
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="report.pdf"`

#### Flow
```
1. Receive HTML string
2. Replace Highcharts CDN URLs with local vendor files
3. Inject bulk runtime script (if bulk export)
4. Launch Puppeteer headless browser
5. Load HTML in new page
6. Wait for document ready (timeout: 60s)
7. Wait for charts to render
8. Freeze charts to images (SVG/canvas → data URL)
9. Generate PDF with page settings
10. Close browser
11. Return PDF blob
```

#### Chart Freezing
```javascript
// backend-reference/server.js L227-265
await page.evaluate((selector) => {
  const charts = Array.from(document.querySelectorAll(selector));
  charts.forEach(chart => {
    const svg = chart.querySelector('svg');
    if (svg) {
      const markup = new XMLSerializer().serializeToString(svg);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
      chart.innerHTML = `<img src="${dataUrl}" style="width:100%;height:auto;">`;
    }
  });
}, CHART_SELECTOR);
```

#### Highcharts URL Replacement
```javascript
// backend-reference/server.js L126-140
function replaceHighchartsUrls(html, baseUrl) {
  const replacements = [
    [/https:\/\/code\.highcharts\.com\/stock\/highstock\.js/gi, `${baseUrl}/vendor/highstock.js`],
    [/https:\/\/code\.highcharts\.com\/highcharts-3d\.js/gi, `${baseUrl}/vendor/highcharts-3d.js`],
    // ... more replacements
  ];
  return replacements.reduce((output, [pattern, nextValue]) => {
    return output.replace(pattern, nextValue);
  }, html);
}
```

---

## Bulk Export Pipeline

### Overview
Bulk export generates multiple reports from JSON/XML data sources and packages them into a ZIP archive.

### Location
- **Client**: `js/main.js` L636-L1186
- **Server**: `backend-reference/server.js` L327+

### Client-Side Flow

#### 1. Modal Initialization
```
1. User clicks "Bulk Export"
2. open-modal command executed
3. Modal rendered with:
   - Datasource file upload
   - Field mapping dropdowns
   - Filename configuration
   - Password field mapping
```

#### 2. Datasource Upload
```
1. User uploads JSON/XML files
2. Files parsed and validated
3. Stored in uploadedJsonFiles array
4. File list rendered with delete buttons
```

#### 3. Field Mapping
```
1. Extract all my-input-json attributes from canvas
2. Extract CSS custom properties (--binding-*)
3. Build mapping configuration
4. Render dropdowns for each field
5. User selects JSON paths
```

#### 4. Filename Configuration
```
1. User specifies JSON path for filename
2. Fallback to original filename
3. Password field mapping (optional)
4. Language/dataset selection (optional)
```

#### 5. Export Execution
```
1. User clicks "Export"
2. buildTemplateAwareBinding() called
3. exportDesignAndSend() called
4. FormData constructed:
   - html: Template HTML
   - payload: Mapping configuration
   - files: JSON/XML files
5. POST to /api/uploadPdf
6. Response handled
7. ZIP downloaded
```

### Server-Side Flow

#### 1. Request Processing
```
1. Receive FormData
2. Parse payload (JSON)
3. Parse uploaded JSON files
4. Normalize XML to JSON (if needed)
```

#### 2. Archive Initialization
```javascript
const archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe(res);
```

#### 3. Per-Record Processing
```
For each JSON object in datasource:
  a. Resolve filename from payload mapping
  b. Prepare HTML with data injection
  c. Replace Highcharts URLs
  d. Inject bulk runtime script
  e. Generate PDF via Puppeteer
  f. Add to archive with resolved filename
```

#### 4. Data Injection
```javascript
// backend-reference/server.js L142-168
function injectBulkRuntime(html, jsonObject) {
  const serializedJson = JSON.stringify(jsonObject);
  const runtimeScript = `
<script>
window.__BULK_EXPORT_JSON__ = ${serializedJson};
localStorage.setItem("common_json", JSON.stringify(window.__BULK_EXPORT_JSON__));
</script>`;
  return html.replace(/<head[^>]*>/i, (match) => `${match}\n${runtimeScript}`);
}
```

#### 5. Filename Resolution
```javascript
// backend-reference/server.js L97-116
function resolveOutputBaseName(jsonObject, originalName, index, payload) {
  const configuredNames = getPayloadValues(payload, "file_name");
  for (const configuredPath of configuredNames) {
    const value = readValueByPath(jsonObject, configuredPath);
    if (value) {
      return sanitizeFilename(String(value));
    }
  }
  return sanitizeFilename(stripExtension(originalName) || `file_${index + 1}`);
}
```

#### 6. Archive Streaming
```javascript
archive.finalize();
// Streams to response as it's generated
```

---

## HTML Snapshot Capture

### getHtmlWithCurrentFormState
**Location**: `js/main.js L420`

#### Purpose
Capture editor HTML with live form state synchronization.

#### Flow
```
1. Get base HTML from editor.getHtml()
2. Create temporary DOM element
3. Get live canvas document
4. Sync form elements:
   - Checkboxes: checked state
   - Radio buttons: checked state
   - Textareas: value
   - Selects: selected options
5. Sync visual dimensions:
   - img, canvas, svg: width/height
   - object-fit property
6. Return synchronized HTML
```

### getPdfPreviewHtmlFromLiveCanvas
**Location**: `js/main.js L505`

#### Purpose
Stronger snapshot with full attribute copying.

#### Flow
```
1. Get base HTML
2. Get live canvas document
3. For each element by ID:
   - Copy class attribute
   - Copy style attribute
   - Copy data-* attributes
   - Copy innerHTML
4. Return enriched HTML
```

### restoreTemplateAwareTextForBulkExport
**Location**: `js/main.js L617`

#### Purpose
Restore original template placeholders before bulk export.

#### Flow
```
1. Find nodes with data-template-text
2. Restore original template sentence
3. Special handling for custom-heading (textContent)
4. Return cleaned HTML
```

---

## Chart Freezing

### Purpose
Convert interactive charts to static images for consistent export.

### Client-Side Freezing
**Location**: `js/exportMultipleFormats.js`

#### Flow
```
1. Identify chart nodes in canvas
2. Get SVG/canvas element
3. Serialize to data URL
4. Replace with img element
5. Preserve dimensions
```

### Server-Side Freezing
**Location**: `backend-reference/server.js L227-265`

#### Flow
```
1. Wait for charts to render (max 60s)
2. Evaluate in page context
3. For each chart:
   a. Find SVG or canvas
   b. Serialize to data URL
   c. Replace with img element
4. Return modified HTML
```

### Chart Selector
```javascript
const CHART_SELECTOR = [
  '[data-i_designer-type="custom_line_chart"]',
  '[data-gjs-type="custom_line_chart"]',
  ".highchart-live-areaspline"
].join(", ");
```

---

## Form State Synchronization

### Purpose
Capture live form state for export.

### Synced Elements
- **Checkboxes**: checked attribute
- **Radio buttons**: checked attribute
- **Textareas**: textContent/value
- **Selects**: selected attribute on options

### Implementation
**Location**: `js/exportMultipleFormats.js L16-100`

```javascript
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
      // Sync selected options
    }
  }
});
```

---

## Visual Dimension Freezing

### Purpose
Preserve resized media dimensions in export.

### Affected Elements
- img
- canvas
- svg

### Implementation
**Location**: `js/exportMultipleFormats.js L64-100`

```javascript
["img", "canvas", "svg"].forEach((selector) => {
  const liveNodes = liveDoc.body.querySelectorAll(selector);
  const exportNodes = tempDiv.querySelectorAll(selector);
  const len = Math.min(liveNodes.length, exportNodes.length);

  for (let i = 0; i < len; i++) {
    const liveNode = liveNodes[i];
    const exportNode = exportNodes[i];

    const rect = liveNode.getBoundingClientRect();
    const width = rect ? Math.round(rect.width) : 0;
    const height = rect ? Math.round(rect.height) : 0;

    if (width > 0) {
      exportNode.style.width = `${width}px`;
      exportNode.setAttribute("width", String(width));
    }

    if (height > 0) {
      exportNode.style.height = `${height}px`;
      exportNode.setAttribute("height", String(height));
    }

    // Copy object-fit property
    const computed = liveDoc.defaultView.getComputedStyle(liveNode);
    if (computed && computed.objectFit) {
      exportNode.style.objectFit = computed.objectFit;
    }
  }
});
```

---

## Template-Aware Binding

### Purpose
Handle sentence-level template binding (e.g., "Hello {name}, welcome to our service").

### Detection
**Location**: `js/main.js L1266`

```javascript
function buildTemplateAwareBinding(node, mappings) {
  const text = node.textContent || node.innerText;
  const placeholderPattern = /\{([^}]+)\}/g;

  if (placeholderPattern.test(text)) {
    // Extract template sentence
    const templateSentence = text;
    const placeholders = text.match(placeholderPattern);

    placeholders.forEach(placeholder => {
      const key = placeholder.replace(/[{}]/g, '');
      // Add to mappings with synthetic path
      mappings.push({
        path: `__i_designer_template_values.${key}`,
        value: key
      });
    });

    return {
      isTemplateAware: true,
      templateSentence,
      resolvedValue: text // Will be replaced during export
    };
  }

  return { isTemplateAware: false };
}
```

### Resolution
**Location**: `js/main.js L1488`

```javascript
// During export, resolve template text
const resolvedText = templateSentence.replace(/\{([^}]+)\}/g, (match, key) => {
  const value = readValueByPath(jsonObject, key);
  return value !== undefined ? value : match;
});

// Enrich JSON with resolved value
jsonObject.__i_designer_template_values = jsonObject.__i_designer_template_values || {};
jsonObject.__i_designer_template_values[key] = resolvedText;
```

---

## Whitespace Normalization

### Purpose
Normalize HTML entities and Unicode spaces before export.

### Implementation
**Location**: `js/main.js L1531`

```javascript
function normalizeTemplateWhitespace(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/\u00a0/g, ' ');
}
```

### Applied To
- Template sentences
- Data values
- Export HTML

---

## ZIP Post-Processing

### Purpose
Filter archive to remove placeholder/helper files.

### Implementation
**Location**: `js/main.js L1586`

```javascript
async function filterTemplateAwareZipEntries(zipBlob) {
  const zip = await JSZip.loadAsync(zipBlob);
  const newZip = new JSZip();

  for (const [filename, file] of Object.entries(zip.files)) {
    // Skip helper files
    if (filename.includes('__i_designer_template_values')) {
      continue;
    }

    // Keep resolved files
    if (filename.includes('_resolved')) {
      const content = await file.async('blob');
      newZip.file(filename, content);
    }
  }

  return newZip.generateAsync({ type: 'blob' });
}
```

### Flow
```
1. Receive ZIP blob from backend
2. Load with JSZip
3. Iterate through entries
4. Filter out helper files
5. Keep resolved files
6. Generate new ZIP
7. Download filtered ZIP
```

---

## Subreport Expansion

### Purpose
Inline subreport content during export.

### Implementation
**Location**: `js/main.js` (within generatePrintDialog)

#### Flow
```
1. Scan for subreport components
2. For each subreport:
   a. Load subreport template from API
   b. Expand subreport content
   c. Merge headers/footers (if enabled)
   d. Inject into main template
3. Update page numbering
4. Render expanded template
```

### Header/Footer Merging
```javascript
if (subreportAttributes.mergeHeaderFooter) {
  // Merge subreport header with main header
  // Merge subreport footer with main footer
  // Share page numbering
}
```

---

## Page Break Handling

### Purpose
Handle page breaks in multi-page reports.

### Implementation
**Location**: `js/page-setup-manager.js`

#### Flow
```
1. Identify page break markers
2. Split content at breaks
3. Render each page separately
4. Apply page settings per page
5. Combine in export
```

### Page Break Types
- Manual page breaks (component-based)
- Automatic page breaks (content overflow)
- Subreport page breaks

---

## Print Optimization

### Purpose
Optimize output for print/PDF.

### Features
- Hide-on-print components excluded
- Print-specific CSS applied
- High-resolution rendering
- Font embedding

### Hide-on-Print
**Location**: `js/hide-on-print.js`

```css
@media print {
  .hide-on-print {
    display: none !important;
  }
}
```

### Print CSS Injection
```javascript
const printCSS = `
@media print {
  body { -webkit-print-color-adjust: exact; }
  .no-print { display: none; }
}`;
```

---

## Error Handling

### Client-Side Errors
- **Export timeout**: Show error toast
- **Missing datasource**: Prompt user to upload
- **Invalid JSON**: Show validation error
- **Chart rendering failure**: Fallback to placeholder

### Server-Side Errors
- **Puppeteer timeout**: Return 504 error
- **Invalid HTML**: Return 400 error
- **File size exceeded**: Return 413 error
- **Memory limit**: Return 507 error

### Retry Logic
- Chart rendering: 3 retries with 60s timeout each
- PDF generation: 1 retry on failure
- Bulk export: Continue on individual record failure

---

## Performance Optimization

### Client-Side
- **Debouncing**: 250ms debounce for rebind
- **Lazy loading**: Components loaded on demand
- **Caching**: Datasource caching in memory
- **Minification**: Not implemented (opportunity)

### Server-Side
- **Streaming**: Archive streaming for large exports
- **Parallel processing**: Not implemented (opportunity)
- **Connection pooling**: Not implemented (opportunity)
- **CDN**: Vendor files served locally

### Next.js Implementation Opportunities
- **Edge functions**: For simple exports
- **Worker threads**: For CPU-intensive rendering
- **Queue system**: For bulk export jobs
- **Caching**: Redis for template caching
- **CDN**: CloudFront for asset delivery