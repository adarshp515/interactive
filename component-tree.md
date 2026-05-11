# Component Tree

## Component Hierarchy

### Root Structure
```
InteractiveDesigner (Editor Instance)
├── Canvas (Iframe)
│   ├── Wrapper (Root DOM Element)
│   │   ├── Page Container(s)
│   │   │   ├── Header (if configured)
│   │   │   ├── Content Components
│   │   │   └── Footer (if configured)
│   │   └── Subreport Containers (if any)
│   └── Styles (injected CSS)
├── Panels
│   ├── Blocks Panel
│   ├── Layers Panel
│   ├── Style Manager Panel
│   └── Traits Panel
├── Asset Manager
├── Commands
└── Plugins
```

---

## Parent-Child Relationships

### Page Manager Component
```
Page Manager
├── Page 1
│   ├── Header
│   ├── Content Components
│   └── Footer
├── Page 2
│   ├── Header
│   ├── Content Components
│   └── Footer
└── ...
```

### Subreport Component
```
Subreport Container
├── Subreport Header (if merged)
├── Subreport Content (from loaded template)
└── Subreport Footer (if merged)
```

### Flow Layout Component
```
Flow Layout Container
├── Flow Column 1
│   ├── Content Items
│   └── ...
├── Flow Column 2
│   ├── Content Items
│   └── ...
└── ...
```

### Table Component
```
Table
├── Thead
│   └── Tr (Row)
│       └── Th (Header Cells)
├── Tbody
│   ├── Tr (Row 1)
│   │   └── Td (Cells)
│   ├── Tr (Row 2)
│   │   └── Td (Cells)
│   └── ...
└── Tfoot (if present)
    └── Tr (Row)
        └── Td (Cells)
```

### JSON Table Component
```
JSON Table Container
├── JSON Table Wrapper
│   └── Table (DataTables)
│       ├── Thead
│       ├── Tbody (dynamic rows from JSON)
│       └── Tfoot
└── Placeholder (if no data)
```

### Chart Component
```
Chart Container
├── Chart Title
├── Chart Legend (if enabled)
└── Chart Rendering Area
    ├── SVG/Canvas (Highcharts output)
    └── Tooltip Container
```

### Form Component
```
Form Container
├── Form Field 1
│   ├── Label
│   └── Input Element
├── Form Field 2
│   ├── Label
│   └── Input Element
└── Submit Button (if present)
```

---

## Render Flow

### Initialization Flow
```
1. index.html loads
2. CSS stylesheets injected
3. Core libraries loaded (jQuery, Bootstrap, etc.)
4. Component plugins registered (js/*.js files)
5. InteractiveDesigner.init() called (js/main.js L2)
6. Plugins initialized with editor instance
7. Canvas iframe created
8. Default components loaded
9. Event listeners attached
10. Editor ready
```

### Component Addition Flow
```
1. User drags block from Blocks Panel
2. Block dropped on canvas
3. Component created from block content
4. Component added to parent (page/container)
5. Component rendered in canvas
6. Traits panel updated with component traits
7. Style panel updated with component styles
8. Layers panel updated with new component
9. Event: component:add fired
10. Layer name updated
```

### Component Selection Flow
```
1. User clicks component in canvas or Layers Panel
2. Component selected in editor
3. Floating toolbar appears (if enabled)
4. Traits panel shows component traits
5. Style panel shows component styles
6. Layers panel highlights selection
7. Event: component:selected fired
8. Resize/rotate handles shown (if enabled)
```

### Component Update Flow
```
1. User modifies trait or style
2. Component model updated
3. Event: component:update fired
4. Component re-rendered in canvas
5. Changes propagated to child components
6. State saved (if auto-save enabled)
```

### Data Rebind Flow
```
1. Datasource file uploaded/changed
2. Event: common-json-files-updated fired
3. Debounce timer started (250ms)
4. Timer expires
5. rebindAllDatasourceComponents() called
6. Each data-aware component queried
7. JSON path resolved
8. Component updated with new data
9. Component re-rendered
10. Form state synchronized
```

---

## State Ownership

### Editor-Level State
- **Location**: `window.editor` global
- **Owner**: main.js initialization
- **Scope**: Global editor instance
- **Shared**: All plugins access via editor API

### Component-Level State
- **Location**: Component model (GrapesJS Component)
- **Owner**: Individual component
- **Scope**: Component instance
- **Shared**: Via parent-child relationships

### Page Manager State
- **Location**: `window.pageManager`
- **Owner**: page-manager-component plugin
- **Scope**: Multi-page management
- **Shared**: Accessed by page-setup-manager

### Page Setup Manager State
- **Location**: `window.pageSetupManager`
- **Owner**: page-setup-manager.js
- **Scope**: Page configuration
- **Shared**: Accessed by export pipeline

### Datasource State
- **Location**: `window.uploadedJsonFiles` array
- **Owner**: main.js
- **Scope**: Global datasource cache
- **Shared**: All data-aware components

### IndexedDB State
- **Location**: TemplateEditorDB
- **Owner**: page-setup-manager.js
- **Scope**: Page content persistence
- **Shared**: Accessed on page load/save

### LocalStorage State
- **Location**: Browser localStorage
- **Owner**: Various components
- **Scope**: Cross-session persistence
- **Shared**: Key-based access

---

## Shared Stores

### Component Store
- **Type**: GrapesJS Component Manager
- **Access**: `editor.DomComponents`
- **Purpose**: Component type registry
- **Shared**: All component registration

### Block Store
- **Type**: GrapesJS Block Manager
- **Access**: `editor.Blocks`
- **Purpose**: Draggable block definitions
- **Shared**: Blocks panel rendering

### Command Store
- **Type**: GrapesJS Command Manager
- **Access**: `editor.Commands`
- **Purpose**: Command registration and execution
- **Shared**: Toolbar buttons, keyboard shortcuts

### Asset Store
- **Type**: GrapesJS Asset Manager
- **Access**: `editor.AssetManager`
- **Purpose**: Asset (image/video) management
- **Shared**: Asset manager panel, components

### Style Store
- **Type**: GrapesJS Style Manager
- **Access**: `editor.StyleManager`
- **Purpose**: CSS property management
- **Shared**: Style panel, components

### Layer Store
- **Type**: GrapesJS Layer Manager
- **Access**: `editor.Layers`
- **Purpose**: Component hierarchy display
- **Shared**: Layers panel, navigation

### Selector Store
- **Type**: GrapesJS Selector Manager
- **Access**: `editor.SelectorManager`
- **Purpose**: CSS selector management
- **Shared**: Style manager, components

---

## Context Providers

### Editor Context
- **Provider**: main.js initialization
- **Consumers**: All plugins
- **API**: `window.editor`
- **Scope**: Global editor instance

### Canvas Context
- **Provider**: GrapesJS Canvas
- **Consumers**: Components, rendering
- **API**: `editor.Canvas`
- **Scope**: Iframe document access

### API Context
- **Provider**: js/apiConfig.js
- **Consumers**: Subreport, template management
- **API**: `window.API_BASE_URL`
- **Scope**: API endpoint configuration

### Datasource Context
- **Provider**: main.js
- **Consumers**: Data-aware components
- **API**: `window.uploadedJsonFiles`, `window.common_json`
- **Scope**: Global datasource cache

### Page Context
- **Provider**: page-manager-component
- **Consumers**: Page setup, export
- **API**: `window.pageManager`
- **Scope**: Multi-page state

---

## Editor Lifecycle

### Startup Phase
```
1. DOM ready
2. Script loading (index.html L44-L106)
3. Component registration
4. Plugin initialization
5. Editor.init() call
6. Canvas creation
7. Default content loading
8. Event binding
9. Ready state
```

### Runtime Phase
```
1. User interactions
2. Component operations
3. State updates
4. Event propagation
5. Re-rendering
6. Auto-save (if enabled)
7. Data rebind (on change)
```

### Export Phase
```
1. Export command triggered
2. HTML snapshot capture
3. Form state sync
4. Chart freezing
5. Data injection
6. API call (if server-side)
7. Response handling
8. Download trigger
```

### Shutdown Phase
```
1. beforeunload event
2. Dirty check (hasChanges)
3. Confirmation prompt (if dirty)
4. Cleanup (IndexedDB, timers)
5. Page unload
```

---

## Plugin Registration Order

### Load Order (index.html L44-L88)
1. `apiConfig.js` - API configuration
2. `custom_errorlogger.js` - Error logging
3. `codeEditor.js` - Code editor
4. `postCssParser.js` - CSS parsing
5. `webPage.js` - Webpage component
6. `basicBlocks.js` - Basic blocks
7. `navbar.js` - Navbar component
8. `countdown.js` - Countdown component
9. `forms.js` - Form components
10. `imageEditor.js` - Image editor
11. `zipExport.js` - ZIP export
12. `customCode.js` - Custom code
13. `toolbox.js` - Toolbox
14. `tooltip.js` - Tooltip
15. `styleBg.js` - Background styles
16. `tabs.js` - Tabs
17. `new_components.js` - New components
18. `source.js` - Source view
19. `custom_chart_nd_common_json.js` - Charts
20. `custom-table.js` - Tables
21. `custom-carousel.js` - Carousel
22. `custom-add-new-font-url.js` - Fonts
23. `custom-loading-page.js` - Loading
24. `custom-tab-with-nav.js` - Tabs with nav
25. `object.js` - Object component
26. `custom-video-in.js` - Video
27. `custom_separator.js` - Separator
28. `page-setup-manager.js` - Page setup
29. `hide-on-print.js` - Hide on print
30. `custom_section.js` - Sections
31. `marqee-tag.js` - Marquee
32. `format_text.js` - Text formatting
33. `customJsonTable.js` - JSON tables
34. `background-audio.js` - Audio
35. `custom_imagesize.js` - Image size
36. `drawingTool.js` - Drawing
37. `qr-barcode.js` - QR/Barcode
38. `custom-shapes.js` - Shapes
39. `areaBreakComponent.js` - Flow layout
40. `exportMultipleFormats.js` - Export formats
41. `tableOfContents.js` - TOC
42. `linkTrackerPlugin.js` - Link tracking
43. `liveLineChartComponent.js` - Live charts
44. `subreport.js` - Subreport
45. `backbutton.js` - Back button
46. `video-forms.js` - Video forms
47. `html2pdf.js` - PDF library
48. `home.js` - GrapesJS bundle
49. `main.js` - Main bootstrap

### Plugin Dependencies
- Some plugins depend on earlier-loaded plugins
- Order matters for trait registration
- Canvas scripts injected after plugin load

---

## Component Type Registry

### Registered Types (from main.js L15-L63)
| Type | Plugin | Category |
|------|--------|----------|
| code-editor-component | codeEditor.js | Tools |
| postcss-parser-component | postCssParser.js | Tools |
| webpage-component | webPage.js | Basic |
| drawingTool | drawingTool.js | Extra |
| custom_line_chart | customChartCommonJson.js | Extra |
| flow-layout | areaBreakComponent.js | Layout |
| custom-table | custom-table.js | Extra |
| json-table | customJsonTable.js | Extra |
| carousel | custom-carousel.js | Extra |
| custom-video-in | custom-video-in.js | Media |
| formatted-rich-text | format_text.js | Basic |
| qr-barcode-component | qr-barcode.js | Basic |
| custom-heading | tableOfContents.js | Basic |
| toc-block | tableOfContents.js | Basic |
| subreport | subreport.js | Extra |
| countdown | countdown.js | Extra |
| form-component | forms.js | Forms |
| video-forms-component | video-forms.js | Forms |
| table-component | table.js | Basic |
| flow-column | areaBreakComponent.js | Layout |

### Built-in GrapesJS Types
- text, link, image, video, map
- wrapper, row, cell
- table, thead, tbody, tfoot, tr, td, th

---

## Event System

### Editor Events
| Event | Trigger | Handler |
|-------|---------|---------|
| `component:add` | Component added | updateLayerName |
| `component:selected` | Component selected | ensureUpDownArrowToolbar |
| `component:update:name` | Name changed | updateLayerName |
| `component:update:attributes` | Attributes changed | updateLayerName |
| `layer:component` | Layer interaction | updateLayerName |
| `load` | Editor loaded | Component initialization |
| `run:open-assets` | Asset manager opened | Inject JSON selector |
| `rte:enable` | RTE enabled | Restore template text |
| `rte:disable` | RTE disabled | Save and rebind |
| `run:core:canvas-clear` | Canvas cleared | Reset slideshow |
| `update` | Any change | Set dirty flag |

### Custom Events
| Event | Trigger | Purpose |
|-------|---------|---------|
| `common-json-files-updated` | Datasource changed | Trigger rebind |
| `arrayDataSelected` | Array data selected | Page distribution |
| `canvasCleared` | Canvas cleared | Cleanup IndexedDB |
| `pageSetupStateChanged` | Page setup changed | UI updates |

---

## Data Flow Between Components

### Datasource Flow
```
JSON/XML File Upload
  → Parse and Normalize
    → Store in uploadedJsonFiles
      → Trigger rebind event
        → Component queries JSON path
          → Resolve value
            → Update component
              → Re-render
```

### Export Flow
```
Export Command
  → Capture HTML snapshot
    → Sync form state
      → Freeze charts
        → Inject data
          → Send to API
            → Generate PDF/ZIP
              → Return blob
                → Download
```

### Subreport Flow
```
Subreport Double-Click
  → Open modal
    → Fetch templates from API
      → User selects template
        → Load template content
          → Inject into subreport container
            → Merge headers/footers (if enabled)
              → Update page numbering
```

### TOC Generation Flow
```
Heading Change
  → Trigger generate-toc command
    → Scan for custom-heading components
      → Extract heading text and level
      → Calculate page numbers
        → Render TOC structure
          → Update TOC component
```