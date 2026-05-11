# Report-Specific Features

## Template Engine

### Purpose
Core template system for report design and rendering based on GrapesJS editor framework.

### Placement in UI
- Main editor canvas (center panel)
- Template management via `template.html`

### Related Modules/Files
- `js/main.js` - Template initialization and lifecycle
- `js/page-setup-manager.js` - Page configuration
- `template.html` - Template listing interface
- `index.html` - Editor entry point

### Usage
Users create report templates by dragging components onto canvas, configuring page settings, and binding data sources.

### Dependencies
- GrapesJS core (via home.js bundle)
- InteractiveDesigner framework
- PageSetupManager for page configuration

### Editable Properties
- Page dimensions (width, height, margins)
- Page orientation (portrait/landscape)
- Header/footer configuration
- Page background settings
- Number of pages

### Non-Editable/Internal Properties
- Template ID (auto-generated)
- Template metadata timestamps
- Internal component IDs
- Canvas state serialization

### Interactions with Other Modules
- Integrates with all component plugins
- Communicates with page manager for multi-page support
- Syncs with export pipeline
- Reads/writes to IndexedDB for persistence

### Backend Relation
- Templates stored via API: `GET/POST /api/getTemplate`, `DELETE /api/deleteTemplate/:id`
- Template JSON includes full component tree and settings

### Rendering Behavior
- Live preview in GrapesJS canvas iframe
- Component-based rendering with trait configuration
- Dynamic data binding during preview

### Export Behavior
- Serialized to JSON format
- Combined with data sources for bulk export
- Sent to backend for PDF generation

### Dynamic Data Behavior
- Supports JSON/XML data binding via `my-input-json` attributes
- Template-aware text binding for sentence-level substitution
- Real-time preview with data resolution

### Permissions/Visibility Rules
- Template listing accessible to all authenticated users
- Edit/delete operations based on template ownership
- No role-based visibility in current implementation

---

## PDF Engine

### Purpose
Server-side PDF generation using Puppeteer with client-side preview capabilities.

### Placement in UI
- Export toolbar (top right)
- Print preview modal

### Related Modules/Files
- `js/exportMultipleFormats.js` - Export orchestration
- `js/html2pdf.js` - Client-side PDF generation
- `backend-reference/server.js` - Server-side PDF rendering
- `js/main.js` - PDF preview dialog generation

### Usage
Users export reports to PDF via toolbar button, choosing between client-side (html2pdf) or server-side (Puppeteer) rendering.

### Dependencies
- Client: html2canvas, jsPDF, html2pdf.js
- Server: Puppeteer, Express, archiver
- Highcharts for chart rendering

### Editable Properties
- Export format (PDF, HTML, DOCX, RTF, Excel)
- Page range selection
- Quality settings (via backend configuration)

### Non-Editable/Internal Properties
- PDF generation timeout (server-configured)
- Chart rendering wait time (60s max)
- Internal snapshot capture logic

### Interactions with Other Modules
- Captures canvas state via `getHtmlWithCurrentFormState`
- Freezes chart rendering before export
- Integrates with bulk export for multi-file generation
- Handles subreport expansion

### Backend Relation
- `POST /api/uploadHtmlToPdf` - Server-side PDF generation
- `POST /api/uploadPdf` - Legacy PDF endpoint
- Highcharts vendor files served from `/vendor/*` routes

### Rendering Behavior
- Client: html2canvas → jsPDF pipeline
- Server: Puppeteer headless Chrome rendering
- Chart freezing: SVG/canvas to image conversion
- Form state synchronization before export

### Export Behavior
- Single file export: direct download
- Bulk export: ZIP archive via archiver
- Filename resolution from JSON data or fallback

### Dynamic Data Behavior
- Data injected into HTML before rendering
- Template-aware text resolution
- Datasource rebind triggered before export

### Permissions/Visibility Rules
- Export accessible to all users with template access
- No additional permission checks

---

## Bulk Export

### Purpose
Generate multiple reports from JSON/XML data sources with batch processing.

### Placement in UI
- "Bulk Export" button in toolbar
- Modal dialog for datasource configuration

### Related Modules/Files
- `js/main.js` - Bulk export modal and logic (L636-L1186)
- `backend-reference/server.js` - Bulk archive streaming (L327+)
- `js/exportMultipleFormats.js` - Export format handling

### Usage
Users upload JSON/XML files, map data fields to components, configure filename/password mappings, and generate ZIP archive.

### Dependencies
- FormData API for file upload
- JSZip for archive handling
- XML-to-JSON conversion (x2js)
- LocalStorage for datasource persistence

### Editable Properties
- Datasource file uploads (JSON/XML)
- Field-to-component mappings
- Filename generation path
- Password field mappings
- Language/dataset selection

### Non-Editable/Internal Properties
- Template-aware synthetic paths (`__i_designer_template_values`)
- Internal file normalization
- Debounce timers for rebind

### Interactions with Other Modules
- Triggers datasource rebind on all components
- Integrates with export pipeline
- Communicates with template engine for data binding
- Uses ZIP export component for archive creation

### Backend Relation
- `POST /api/uploadPdf` - Bulk export endpoint
- `POST /api/uploadHtml` - HTML bulk export
- Stream processing via archiver for large datasets

### Rendering Behavior
- Template-aware text restoration before export
- Whitespace normalization (`&nbsp;`, `&#160;` → space)
- Chart rendering and freezing
- Form state capture

### Export Behavior
- ZIP archive generation
- Filename resolution from JSON data
- Placeholder filtering to remove helper files
- Download via filtered blob

### Dynamic Data Behavior
- JSON/XML parsing and normalization
- Path-based field extraction
- Template sentence resolution
- Multi-language/dataset support

### Permissions/Visibility Rules
- No specific permission checks
- File size limits: 50MB per file, 200 files max (server-configured)

---

## Bindings (Data Binding)

### Purpose
Connect report components to JSON/XML data sources for dynamic content generation.

### Placement in UI
- Component trait panel (right sidebar)
- "DataSource Path" field in component properties
- Bulk export modal for mapping configuration

### Related Modules/Files
- `js/main.js` - Binding extraction and rebind logic
- `js/customJsonTable.js` - Table-specific binding
- `js/highchart/custom_chart_nd_common_json.js` - Chart binding
- `js/format_text.js` - Text binding with formatting

### Usage
Users specify JSON paths (e.g., `customer.name`) in component traits to bind data fields.

### Dependencies
- Custom attribute: `my-input-json`
- Custom attribute: `data-template-text` (template-aware)
- Custom attribute: `json-file-index`
- Custom attribute: `json-language`

### Editable Properties
- `my-input-json` - JSON path to data field
- `json-file-index` - Which datasource file to use (0-based)
- `json-language` - Top-level key for multi-language support
- `data-template-text` - Template sentence for sentence-level binding

### Non-Editable/Internal Properties
- Internal binding extraction logic
- Synthetic path generation for template-aware bindings
- Debounce timer for rebind operations

### Interactions with Other Modules
- Triggers rebind on component selection/add
- Integrates with bulk export mapping
- Communicates with all data-aware components

### Backend Relation
- No direct backend interaction
- Data sources uploaded and stored client-side (localStorage)
- Sent with export payload to backend

### Rendering Behavior
- Data resolution during preview
- Real-time updates on datasource change
- Template sentence substitution

### Export Behavior
- Binding data included in export payload
- Template-aware values enriched with resolved text
- Path mappings sent to backend

### Dynamic Data Behavior
- Path-based traversal: `customer.address.city`
- Array handling for table rows
- Formula evaluation support (via formula-parser)
- Conditional rendering based on data

### Permissions/Visibility Rules
- No permission restrictions
- All bindings accessible to template editor

---

## Charts

### Purpose
Interactive data visualization components using Highcharts library.

### Placement in UI
- Draggable blocks in "Basic" or "Extra" categories
- Canvas rendering area
- Chart-specific trait panel

### Related Modules/Files
- `js/highchart/custom_chart_nd_common_json.js` - Main chart component
- `js/liveLineChartComponent.js` - Live line chart variant
- Highcharts CDN libraries

### Usage
Users drag chart blocks, configure chart type, bind data sources, and customize appearance.

### Dependencies
- Highcharts core (v11)
- Highcharts modules: 3d, more, data, exporting, accessibility, drilldown
- Formula-parser for data transformation

### Editable Properties
- Chart type: pie, line, column, bar, donut, scatter, area, bubble, spiderweb, candlestick, OHLC, 3D variants, stacked variants
- Chart title
- Title alignment (left/right/center)
- Data source path (`my-input-json`)
- Chart dimensions
- Color scheme
- Axis configuration

### Non-Editable/Internal Properties
- Internal chart instance
- Rendering state
- Data-ready attribute

### Interactions with Other Modules
- Integrates with datasource binding system
- Communicates with export pipeline for chart freezing
- Responds to page resize events

### Backend Relation
- Highcharts vendor files served from backend during export
- Chart data sent with export payload

### Rendering Behavior
- Live rendering in canvas iframe
- SVG/canvas output
- Responsive to data changes
- 3D chart support via WebGL

### Export Behavior
- Chart freezing: SVG/canvas → image conversion
- Server-side Highcharts rendering for PDF
- Data URL injection for frozen charts

### Dynamic Data Behavior
- JSON path binding for chart data
- Array-based series data
- Real-time updates on datasource change
- Formula evaluation for calculated fields

### Permissions/Visibility Rules
- No specific restrictions
- All chart types available to all users

---

## Tables

### Purpose
Advanced table components with data binding, conditional formatting, and formula support.

### Placement in UI
- "Table" block in "Extra" category
- Canvas rendering area
- Table-specific trait panel

### Related Modules/Files
- `js/custom-table.js` - Standard table with formula support
- `js/customJsonTable.js` - JSON-driven table with DataTables
- `js/table.js` - Basic table component

### Usage
Users create tables, bind to JSON arrays, configure conditional highlighting, and add formulas.

### Dependencies
- DataTables for advanced features (pagination, sorting, export)
- Formula-parser for cell calculations
- HyperFormula for spreadsheet-like formulas

### Editable Properties
- Data source path (`my-input-json`)
- Column configurations
- Conditional formatting rules
- Cell formulas
- Border/styling options
- Pagination settings

### Non-Editable/Internal Properties
- Internal DataTable instance
- Formula engine state
- Highlighting state tracking

### Interactions with Other Modules
- Integrates with datasource binding
- Communicates with export pipeline
- Formula evaluation interaction with text formatting

### Backend Relation
- No direct backend interaction
- Table data sent with export payload

### Rendering Behavior
- DataTables rendering with pagination
- Conditional highlighting application
- Formula evaluation on data load
- Responsive column widths

### Export Behavior
- DataTables export buttons (Excel, PDF, CSV)
- Form state capture for checkboxes/radios
- Visual dimension freezing for export

### Dynamic Data Behavior
- Array-based row generation
- Column mapping from JSON keys
- Real-time updates on datasource change
- Formula recalculation on data changes

### Permissions/Visibility Rules
- No specific restrictions
- All table features available to all users

---

## Pagination

### Purpose
Multi-page report management with page breaks, headers/footers, and page numbering.

### Placement in UI
- "Pages" panel in left sidebar
- Page setup toolbar
- Page navigation controls

### Related Modules/Files
- `js/page-setup-manager.js` - Core page management
- `js/main.js` - Page manager integration
- Page manager component (built-in GrapesJS plugin)

### Usage
Users add/remove pages, configure page settings, set headers/footers, and manage page breaks.

### Dependencies
- Page manager GrapesJS plugin
- IndexedDB for page persistence
- Custom event system for page state

### Editable Properties
- Page dimensions (width, height, margins)
- Page orientation
- Header content per page
- Footer content per page
- Page numbering format
- Page background

### Non-Editable/Internal Properties
- Page index
- Internal page content cache
- IndexedDB storage keys

### Interactions with Other Modules
- Integrates with template engine
- Communicates with export pipeline
- Syncs with component tree
- Manages subreport page allocation

### Backend Relation
- Page settings stored in template JSON
- No direct backend API for page management

### Rendering Behavior
- Individual page rendering in canvas
- Page break visualization
- Header/footer rendering on each page
- Page number display

### Export Behavior
- Page-by-page export
- Header/footer preservation
- Page numbering in output
- Subreport page merging

### Dynamic Data Behavior
- No dynamic data binding
- Static configuration per page

### Permissions/Visibility Rules
- No specific restrictions
- All users can manage pages

---

## Print Optimization

### Purpose
Optimize reports for print output with hide-on-print controls and layout adjustments.

### Placement in UI
- "Hide on print" trait in component properties
- Print preview modal

### Related Modules/Files
- `js/hide-on-print.js` - Hide-on-print component
- `js/main.js` - Print dialog generation

### Usage
Users mark components as "hide on print" to exclude them from PDF/printed output.

### Dependencies
- CSS class: `.hide-on-print`
- Trait: `hideOnPrint`

### Editable Properties
- `hideOnPrint` - Checkbox to hide component in print

### Non-Editable/Internal Properties
- Internal CSS injection
- Print media query handling

### Interactions with Other Modules
- Integrates with export pipeline
- CSS class application during export

### Backend Relation
- No direct backend interaction
- CSS-based filtering during export

### Rendering Behavior
- Hidden in print media queries
- Visible in editor canvas

### Export Behavior
- Components with `hide-on-print` class excluded from output
- CSS-based filtering in generated HTML

### Dynamic Data Behavior
- No dynamic data interaction

### Permissions/Visibility Rules
- No specific restrictions
- All users can use hide-on-print

---

## Dynamic Rendering

### Purpose
Real-time report preview with data binding and live component updates.

### Placement in UI
- Main canvas editor (center panel)
- Component trait panel (right sidebar)

### Related Modules/Files
- `js/main.js` - Datasource rebind orchestration
- Component-specific files for dynamic updates
- `js/customJsonTable.js` - Table dynamic rendering

### Usage
Users see live preview of reports with data bound from uploaded JSON/XML files.

### Dependencies
- Event system for data changes
- Component update mechanisms
- LocalStorage for datasource persistence

### Editable Properties
- Datasource file uploads
- JSON path bindings
- Rebind trigger (manual/automatic)

### Non-Editable/Internal Properties
- Rebind debounce timer (250ms)
- Internal component update queue
- Datasource cache

### Interactions with Other Modules
- Triggers updates on all data-aware components
- Communicates with binding system
- Integrates with export pipeline

### Backend Relation
- No direct backend interaction
- All data handling client-side

### Rendering Behavior
- Real-time component updates on data change
- Template text substitution
- Chart/table re-rendering

### Export Behavior
- Current state captured before export
- Form state synchronization
- Visual dimension freezing

### Dynamic Data Behavior
- JSON/XML parsing and caching
- Path-based data extraction
- Array expansion for tables/charts
- Template sentence resolution

### Permissions/Visibility Rules
- No specific restrictions
- All users can use dynamic rendering

---

## Interactive Reports

### Purpose
Interactive report elements including clickable TOC, form inputs, and navigation.

### Placement in UI
- Canvas editor for design
- Preview mode for interaction

### Related Modules/Files
- `js/tableOfContents.js` - Clickable TOC with navigation
- `js/forms.js` - Form components
- `js/video-forms.js` - Video-enhanced forms
- `js/backbutton.js` - Navigation buttons

### Usage
Users add interactive elements that work in preview/exported HTML.

### Dependencies
- Anchor link handling
- Form event capture
- Video embedding

### Editable Properties
- TOC: clickable headings, page numbers
- Forms: input types, validation
- Navigation: target pages/URLs

### Non-Editable/Internal Properties
- Internal link tracking
- Form state capture
- Video player state

### Interactions with Other Modules
- Integrates with export pipeline
- Form state capture for export
- Link scanning for same-page navigation

### Backend Relation
- No direct backend interaction
- All interaction client-side

### Rendering Behavior
- Standard HTML rendering
- JavaScript for interactivity
- CSS for styling

### Export Behavior
- Interactive elements preserved in HTML export
- Form state captured for PDF export
- Links preserved in all formats

### Dynamic Data Behavior
- Form values can be data-bound
- TOC generated from heading components

### Permissions/Visibility Rules
- No specific restrictions
- All users can add interactive elements