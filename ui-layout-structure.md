# UI Layout Structure

## Overall Layout

### Purpose
Main editor interface layout based on GrapesJS framework with custom panels and toolbars.

### Layout Type
Three-column layout with top toolbar:
- Left: Layers panel + Component blocks
- Center: Canvas editor
- Right: Style manager + Traits panel
- Top: Toolbar with actions

### Related Modules/Files
- `index.html` - Main HTML structure
- `js/main.js` - Editor initialization
- `css/home.css` - Main stylesheet
- `css/custom.css` - Custom styles

---

## Navbar Structure

### Purpose
Top navigation bar with export, save, and template management actions.

### Placement
Top of editor interface (fixed height)

### Components
- Logo/Title (left)
- Export PDF button
- Save button
- Import button
- All Templates button (links to template.html)
- All Logs button (links to logs.html)
- Excel/CSV Upload button
- Bulk Export button

### Related Modules/Files
- `js/navbar.js` - Navbar component
- `js/main.js` - Toolbar button bindings (L392-L416)
- `css/home.css` - Navbar styling

### Button Bindings
| Element ID | Handler | Action |
|------------|---------|--------|
| `exportPDF` | `generatePrintDialog` | Open PDF preview modal |
| `savePage` | `savePage` | Save current template |
| `importPage` | `importSinglePages` | Import template from file |
| `allTemplateList` | `viewAllTemplates` | Navigate to template.html |
| `allLogs` | `viewAllLogsD` | Navigate to logs.html |
| `excelCsvUpload` | `uploadExcelCsv` | Upload Excel/CSV datasource |

### Responsive Behavior
- Fixed height, no responsive adaptation
- Horizontal scrolling on small screens
- Button wrapping on very small screens

### Interactions
- Opens modals for export/preview
- Triggers save/load operations
- Navigates to external pages

---

## Sidebars

### Left Sidebar

#### Purpose
Component blocks and layers panel for template construction.

#### Components
- **Blocks Panel**: Draggable component categories
  - Basic: Text, Image, Video, Link, etc.
  - Extra: Table, Chart, QR/Barcode, etc.
  - Forms: Form elements
  - Pages: Page management
- **Layers Panel**: Hierarchical component tree
  - Component hierarchy display
  - Selection and navigation
  - Drag-and-drop reordering

#### Related Modules/Files
- GrapesJS built-in panels
- `js/main.js` - Layer name updates (L170-L195)
- `js/toolbox.js` - Toolbox component

#### Responsive Behavior
- Fixed width (approx 250px)
- Collapsible via GrapesJS panel toggles
- Vertical scrolling for long lists

#### Interactions
- Drag blocks to canvas
- Click layers to select components
- Drag layers to reorder hierarchy

---

### Right Sidebar

#### Purpose
Style manager and trait panel for component configuration.

#### Components
- **Style Manager**: CSS property editor
  - Typography settings
  - Colors and backgrounds
  - Borders and spacing
  - Layout properties
- **Traits Panel**: Component-specific properties
  - Data source bindings
  - Component configuration
  - Custom attributes
  - Event handlers

#### Related Modules/Files
- GrapesJS built-in panels
- Component-specific trait definitions
- `js/format_text.js` - Format traits
- `js/highchart/custom_chart_nd_common_json.js` - Chart traits

#### Responsive Behavior
- Fixed width (approx 300px)
- Collapsible via GrapesJS panel toggles
- Vertical scrolling for long property lists

#### Interactions
- Edit styles with live preview
- Configure component traits
- Update data bindings
- Trigger re-renders on change

---

## Modals

### Print Preview Modal

#### Purpose
Preview report before PDF export with page navigation.

#### Placement
Centered overlay over entire editor

#### Components
- Preview iframe with rendered report
- Page navigation controls
- Export format selector
- Page range controls
- Export button

#### Related Modules/Files
- `js/main.js` - `generatePrintDialog` function (L1527+)
- `js/exportMultipleFormats.js` - Export format handling

#### Responsive Behavior
- Fixed size (approx 80% viewport)
- Scrollable preview area
- Responsive page navigation

#### Interactions
- Navigate pages
- Select export format
- Trigger export
- Close modal

---

### Bulk Export Modal

#### Purpose
Configure bulk export with datasource uploads and field mappings.

#### Placement
Centered overlay over entire editor

#### Components
- Datasource file upload area
- Uploaded files list with delete buttons
- Field mapping dropdowns
- Filename path configuration
- Password field mapping
- Language/dataset selection
- Export button

#### Related Modules/Files
- `js/main.js` - Bulk export modal (L636-L1186)
- Template-aware binding detection

#### Responsive Behavior
- Fixed size (approx 70% viewport)
- Scrollable content area
- Responsive form layout

#### Interactions
- Upload JSON/XML files
- Map fields to components
- Configure filename generation
- Trigger bulk export
- Close modal

---

### Subreport Selection Modal

#### Purpose
Select subreport template from template library.

#### Placement
Centered overlay over entire editor

#### Components
- Template search input
- Template table with pagination
- Add button per template
- Page navigation controls

#### Related Modules/Files
- `js/subreport.js` - Subreport modal (L135-L250+)

#### Responsive Behavior
- Fixed size (approx 60% viewport)
- Scrollable table area
- Responsive pagination

#### Interactions
- Search templates
- Navigate pages
- Select subreport
- Close modal

---

### QR/Barcode Editor Modal

#### Purpose
Configure QR code or barcode properties.

#### Placement
Centered overlay over entire editor

#### Components
- Type selector (QR/Barcode)
- Text input or JSON path
- Size controls
- Error correction level
- Show text option
- Preview area

#### Related Modules/Files
- `js/qr-barcode.js` - QR/Barcode popup

#### Responsive Behavior
- Fixed size (approx 400x500px)
- Responsive form layout

#### Interactions
- Configure QR/Barcode properties
- Preview changes
- Apply to component
- Close modal

---

### Page Setup Modal

#### Purpose
Configure page dimensions, margins, and header/footer.

#### Placement
Centered overlay over entire editor

#### Components
- Page size selector
- Orientation toggle
- Margin inputs
- Header/footer editors
- Background settings
- Apply button

#### Related Modules/Files
- `js/page-setup-manager.js` - Page setup modal

#### Responsive Behavior
- Fixed size (approx 500x600px)
- Responsive form layout

#### Interactions
- Configure page settings
- Preview changes
- Apply to pages
- Close modal

---

## Overlays

### Loading Overlay

#### Purpose
Show loading state during operations.

#### Placement
Full-screen overlay with spinner

#### Components
- Spinner animation
- Loading message

#### Related Modules/Files
- `js/custom-loading-page.js` - Loading component

#### Responsive Behavior
- Full screen, fixed
- Centered spinner

#### Interactions
- Show on operation start
- Hide on operation complete

---

### Toast Notifications

#### Purpose
Show transient success/error messages.

#### Placement
Top-right corner of screen

#### Components
- Message text
- Type indicator (color)
- Auto-dismiss timer

#### Related Modules/Files
- `js/custom-table.js` - `showToast` function (L43-67)
- `js/custom_errorlogger.js` - Error notifications

#### Responsive Behavior
- Fixed position
- Auto-dismiss after 3 seconds
- Stack multiple notifications

#### Interactions
- Show message
- Auto-dismiss
- Manual dismiss on click

---

## Floating Toolbars

### Component Toolbar

#### Purpose
Quick actions for selected component.

#### Placement
Floating above selected component in canvas

#### Components
- Move up/down arrows
- Delete button
- Copy button
- Parent/child navigation

#### Related Modules/Files
- `js/main.js` - Arrow toolbar (L3293+)
- GrapesJS built-in component toolbar

#### Responsive Behavior
- Follows component position
- Auto-position to avoid overflow

#### Interactions
- Move component in hierarchy
- Delete component
- Copy component
- Navigate to parent/child

---

### Resize/Rotate Handles

#### Purpose
Resize and rotate components visually.

#### Placement
Around selected component in canvas

#### Components
- Corner resize handles
- Edge resize handles
- Rotation handle (top)

#### Related Modules/Files
- `js/main.js` - Resize/rotate enable (L3299+)
- GrapesJS built-in resize/rotate

#### Responsive Behavior
- Follows component size
- Visual feedback on hover

#### Interactions
- Drag to resize
- Drag rotation handle to rotate
- Snap to grid (if enabled)

---

## Canvas/Editor Layout

### Purpose
Main editing area with live preview of report.

### Placement
Center panel between sidebars

### Components
- Iframe with isolated document
- Rulers (optional)
- Zoom controls
- Page container
- Component rendering

#### Related Modules/Files
- `js/main.js` - Canvas configuration (L78-L129)
- GrapesJS canvas API
- `css/home.css` - Canvas styling

#### Responsive Behavior
- Flexible width/height
- Scrollable for large pages
- Zoom in/out controls

#### Interactions
- Drag components
- Select components
- Edit text inline
- Right-click context menu

---

## Viewer Layout

### Purpose
Preview mode for viewing reports without editing.

### Placement
Replaces canvas in preview mode

### Components
- Full-page preview
- Navigation controls
- Print button
- Close preview button

#### Related Modules/Files
- `js/main.js` - Preview generation
- Export modals

#### Responsive Behavior
- Full viewport
- Responsive content scaling

#### Interactions
- Navigate pages
- Print
- Close preview

---

## Responsive Behavior

### Desktop (1024px+)
- Full three-column layout
- All panels visible
- Horizontal toolbar

### Tablet (768px-1023px)
- Collapsible sidebars
- Scrollable toolbar
- Smaller canvas area

### Mobile (<768px)
- Single column layout
- Panel toggles via buttons
- Stacked toolbar
- Limited functionality

---

## Interaction Flow

### Typical Workflow
1. User opens editor (index.html)
2. User drags component from left sidebar
3. Component appears in canvas
4. User selects component in canvas
5. Traits panel shows component properties
6. User configures traits (data binding, etc.)
7. Style panel shows CSS properties
8. User adjusts styles
9. Changes reflected in canvas
10. User clicks export
11. Export modal opens
12. User configures export options
13. Export generated and downloaded

### Modal Flow
1. Modal triggered by button/action
2. Modal content rendered
3. User interacts with modal
4. Modal action triggered
5. Modal closed
6. Main UI updated based on action

### Canvas Interaction Flow
1. User clicks component in canvas
2. Component selected
3. Floating toolbar appears
4. Traits panel updates
5. Style panel updates
6. Layers panel highlights selection
7. User modifies properties
8. Component updates in canvas
9. Changes saved to state

---

## External Pages

### Template Management Page (template.html)

#### Purpose
List, search, and manage report templates.

#### Layout
- Header with back button and create new button
- Search and filter toolbar
- Paginated table of templates
- Template actions (edit, delete)

#### Related Modules/Files
- `template.html` - Page structure
- API integration for template CRUD

#### Responsive Behavior
- Responsive table
- Mobile-friendly pagination
- Collapsible filters

---

### Logs Page (logs.html)

#### Purpose
View system logs and errors.

#### Layout
- Header with back button
- Log table with timestamps
- Filtering options

#### Related Modules/Files
- `logs.html` - Page structure
- Error logging integration

#### Responsive Behavior
- Responsive table
- Mobile-friendly layout

---

### Login Page (login.html)

#### Purpose
Basic login interface (minimal implementation).

#### Layout
- Simple login form
- Username/password fields
- Submit button

#### Related Modules/Files
- `login.html` - Page structure
- `css/login.css` - Styling

#### Responsive Behavior
- Centered form
- Mobile-friendly

---

## CSS Architecture

### Stylesheet Organization
- `css/home.css` - Main editor styles (76KB)
- `css/custom.css` - Custom overrides
- `css/styleBg.css` - Background styles
- `css/codeEditor.css` - Code editor styles
- `css/login.css` - Login page styles
- `css/main.css` - Shared styles

### CSS Classes (Key)
- `.i_designer-am-file-uploader` - Asset manager upload
- `.gjs-cv-canvas` - Canvas container
- `.gjs-pn-panel` - Panel containers
- `.gjs-block` - Component blocks
- `.gjs-layer` - Layer items
- `.hide-on-print` - Print exclusion
- `.json-table-container` - JSON table wrapper
- `.subreport-container` - Subreport wrapper
- `.table-of-contents` - TOC container