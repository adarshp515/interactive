# Reusable Components

## Overview

The platform provides a comprehensive set of reusable components for report building, organized by category and functionality.

---

## Basic Components

### Text Component

#### Purpose
Editable text content for reports.

#### Placement
- "Text" block in "Basic" category
- Canvas editor

#### Related Files
- GrapesJS built-in text component

#### Usage
Drag text block to canvas, edit content inline.

#### Editable Properties
- Content (editable inline)
- Font family
- Font size
- Font weight
- Color
- Alignment
- Line height
- Letter spacing

#### Non-Editable Properties
- Component ID (auto-generated)

#### Interactions
- Inline editing
- Style manager integration
- Data binding via traits

#### Backend Relation
None

#### Rendering Behavior
Standard HTML text rendering with inline styles.

#### Export Behavior
Preserved in all export formats.

#### Dynamic Data Behavior
Can bind to JSON path via custom trait.

#### Permissions
All users can use text component.

---

### Image Component

#### Purpose
Image embedding and editing.

#### Placement
- "Image" block in "Basic" category
- Asset manager

#### Related Files
- `js/imageEditor.js` - Image editing
- `image-editor-component` plugin

#### Usage
Drag image block, upload or select from asset manager.

#### Editable Properties
- Source URL or base64
- Width/height
- Alt text
- Object-fit
- Border radius
- Opacity

#### Non-Editable Properties
- Internal image state

#### Interactions
- Asset manager integration
- Image editor overlay
- Resize handles

#### Backend Relation
Images sent with export payload.

#### Rendering Behavior
Standard HTML img element with styles.

#### Export Behavior
Embedded as base64 or URL reference.

#### Dynamic Data Behavior
Can bind image URL from JSON.

#### Permissions
All users can use image component.

---

### Video Component

#### Purpose
Video embedding for interactive reports.

#### Placement
- "Video" block in "Basic" category
- "Video Form" block in "Forms" category

#### Related Files
- `js/custom-video-in.js` - Video component
- `js/video-forms.js` - Video-enhanced forms

#### Usage
Drag video block, configure video source.

#### Editable Properties
- Video URL (YouTube, Vimeo, or direct)
- Width/height
- Autoplay
- Controls
- Loop
- Muted

#### Non-Editable Properties
- Video player state

#### Interactions
- Video player controls
- Form integration (video-forms)

#### Backend Relation
Video URLs referenced in export.

#### Rendering Behavior
HTML5 video or iframe for embeds.

#### Export Behavior
Video player preserved in HTML export.

#### Dynamic Data Behavior
Can bind video URL from JSON.

#### Permissions
All users can use video component.

---

### Link Component

#### Purpose
Hyperlink creation for navigation.

#### Placement
- "Link" block in "Basic" category

#### Related Files
- GrapesJS built-in link component

#### Usage
Drag link block, configure URL and text.

#### Editable Properties
- URL
- Link text
- Target (_blank, _self, etc.)
- Color
- Text decoration

#### Non-Editable Properties
- Link state

#### Interactions
- Click to navigate
- Style manager integration

#### Backend Relation
None

#### Rendering Behavior
Standard HTML anchor element.

#### Export Behavior
Links preserved in all formats.

#### Dynamic Data Behavior
Can bind URL from JSON.

#### Permissions
All users can use link component.

---

### Heading Component (Custom)

#### Purpose
Structured headings for TOC generation.

#### Placement
- "Heading" block in "Basic" category

#### Related Files
- `js/tableOfContents.js` - Custom heading definition

#### Usage
Drag heading block, set level (H1-H7).

#### Editable Properties
- Level (H1-H7)
- Content (editable inline)
- Font size (per level)

#### Non-Editable Properties
- Internal TOC tracking

#### Interactions
- Auto-generates TOC entry
- Updates TOC on change

#### Backend Relation
None

#### Rendering Behavior
HTML heading elements with custom class.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
Can bind content from JSON.

#### Permissions
All users can use heading component.

---

## Form Components

### Form Container

#### Purpose
Form wrapper for form elements.

#### Placement
- "Form" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag form block, add form fields inside.

#### Editable Properties
- Form action URL
- Method (GET/POST)
- Encoding type

#### Non-Editable Properties
- Form submission state

#### Interactions
- Contains form fields
- Captures form state for export

#### Backend Relation
Form data sent with export payload.

#### Rendering Behavior
Standard HTML form element.

#### Export Behavior
Form state captured for PDF export.

#### Dynamic Data Behavior
Form fields can bind to JSON.

#### Permissions
All users can use form component.

---

### Input Field

#### Purpose
Text input for user data entry.

#### Placement
- "Input" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag input block, configure type and placeholder.

#### Editable Properties
- Input type (text, email, number, etc.)
- Placeholder
- Default value
- Required flag
- Validation pattern

#### Non-Editable Properties
- Input value state

#### Interactions
- User input capture
- Validation feedback

#### Backend Relation
Input value captured for export.

#### Rendering Behavior
Standard HTML input element.

#### Export Behavior
Current value captured in export.

#### Dynamic Data Behavior
Can bind default value from JSON.

#### Permissions
All users can use input component.

---

### Textarea

#### Purpose
Multi-line text input.

#### Placement
- "Textarea" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag textarea block, configure rows/cols.

#### Editable Properties
- Rows
- Columns
- Placeholder
- Default value
- Max length

#### Non-Editable Properties
- Textarea content state

#### Interactions
- Multi-line input capture
- Resize handle

#### Backend Relation
Textarea value captured for export.

#### Rendering Behavior
Standard HTML textarea element.

#### Export Behavior
Current value captured in export.

#### Dynamic Data Behavior
Can bind default value from JSON.

#### Permissions
All users can use textarea component.

---

### Checkbox

#### Purpose
Boolean input for yes/no options.

#### Placement
- "Checkbox" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag checkbox block, configure label.

#### Editable Properties
- Label text
- Default checked state
- Required flag

#### Non-Editable Properties
- Checked state

#### Interactions
- Toggle on click
- State capture for export

#### Backend Relation
Checked state captured for export.

#### Rendering Behavior
Standard HTML checkbox input.

#### Export Behavior
Checked state captured in export.

#### Dynamic Data Behavior
Can bind default state from JSON.

#### Permissions
All users can use checkbox component.

---

### Radio Button

#### Purpose
Single-select option group.

#### Placement
- "Radio" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag radio blocks with same name for grouping.

#### Editable Properties
- Label text
- Value
- Default selected
- Required flag

#### Non-Editable Properties
- Selected state

#### Interactions
- Single selection within group
- State capture for export

#### Backend Relation
Selected value captured for export.

#### Rendering Behavior
Standard HTML radio input.

#### Export Behavior
Selected state captured in export.

#### Dynamic Data Behavior
Can bind default selection from JSON.

#### Permissions
All users can use radio component.

---

### Select Dropdown

#### Purpose
Single-select from predefined options.

#### Placement
- "Select" block in "Forms" category

#### Related Files
- `js/forms.js` - Form components

#### Usage
Drag select block, add options.

#### Editable Properties
- Options list
- Default selected
- Required flag
- Multiple flag

#### Non-Editable Properties
- Selected state

#### Interactions
- Dropdown selection
- State capture for export

#### Backend Relation
Selected value captured for export.

#### Rendering Behavior
Standard HTML select element.

#### Export Behavior
Selected state captured in export.

#### Dynamic Data Behavior
Options can bind from JSON array.

#### Permissions
All users can use select component.

---

## Layout Components

### Container/Wrapper

#### Purpose
Generic container for layout.

#### Placement
- "Container" block in "Basic" category

#### Related Files
- GrapesJS built-in wrapper component

#### Usage
Drag container block, nest components inside.

#### Editable Properties
- Width/height
- Padding/margin
- Background color
- Border
- Flexbox/grid settings

#### Non-Editable Properties
- Container state

#### Interactions
- Droppable for children
- Resize handles

#### Backend Relation
None

#### Rendering Behavior
HTML div with styles.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
None

#### Permissions
All users can use container component.

---

### Row

#### Purpose
Horizontal layout container.

#### Placement
- "Row" block in "Basic" category

#### Related Files
- GrapesJS built-in row component

#### Usage
Drag row block, add columns inside.

#### Editable Properties
- Flexbox properties
- Gap
- Alignment
- Justification

#### Non-Editable Properties
- Row state

#### Interactions
- Contains columns
- Flex layout

#### Backend Relation
None

#### Rendering Behavior
HTML div with flexbox styles.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
None

#### Permissions
All users can use row component.

---

### Column

#### Purpose
Vertical layout container within rows.

#### Placement
- "Column" block in "Basic" category

#### Related Files
- GrapesJS built-in cell component

#### Usage
Drag column block, add content inside.

#### Editable Properties
- Width (flex or fixed)
- Padding/margin
- Background color

#### Non-Editable Properties
- Column state

#### Interactions
- Contains content
- Flex sizing

#### Backend Relation
None

#### Rendering Behavior
HTML div with flex styles.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
None

#### Permissions
All users can use column component.

---

### Flow Layout

#### Purpose
Dynamic text flow with automatic column wrapping.

#### Placement
- "Flow Layout" block in "Extra" category

#### Related Files
- `js/areaBreakComponent.js` - Flow layout component

#### Usage
Drag flow layout block, add items, configure columns.

#### Editable Properties
- Number of columns
- Column width
- Gap
- Alignment

#### Non-Editable Properties
- Internal reflow state

#### Interactions
- Automatic item distribution
- Responsive reflow

#### Backend Relation
None

#### Rendering Behavior
Custom JavaScript-driven layout.

#### Export Behavior
Layout preserved in export.

#### Dynamic Data Behavior
Items can bind from JSON array.

#### Permissions
All users can use flow layout component.

---

## Data Components

### Table (Standard)

#### Purpose
Tabular data display with formula support.

#### Placement
- "Table" block in "Extra" category

#### Related Files
- `js/custom-table.js` - Standard table
- `js/table.js` - Basic table

#### Usage
Drag table block, configure rows/columns, add formulas.

#### Editable Properties
- Data source path (my-input-json)
- Column definitions
- Cell formulas
- Conditional formatting
- Border/styling

#### Non-Editable Properties
- Internal DataTable instance
- Formula engine state

#### Interactions
- Formula evaluation
- Conditional highlighting
- DataTable features (sort, pagination)

#### Backend Relation
Table data sent with export payload.

#### Rendering Behavior
DataTables with formula evaluation.

#### Export Behavior
DataTables export buttons + PDF capture.

#### Dynamic Data Behavior
Rows generated from JSON array.

#### Permissions
All users can use table component.

---

### JSON Table

#### Purpose
Dynamic table driven by JSON data with advanced features.

#### Placement
- "JSON Table" block in "Extra" category

#### Related Files
- `js/customJsonTable.js` - JSON table component

#### Usage
Drag JSON table block, bind to JSON path, configure columns.

#### Editable Properties
- Data source path (my-input-json)
- Column mappings
- Conditional formatting
- Pagination settings
- Export buttons

#### Non-Editable Properties
- Internal DataTable instance
- Highlighting state

#### Interactions
- DataTable features
- Conditional highlighting
- Export to Excel/PDF/CSV

#### Backend Relation
Table data sent with export payload.

#### Rendering Behavior
DataTables with JSON-driven rows.

#### Export Behavior
DataTables export + PDF capture.

#### Dynamic Data Behavior
Rows generated from JSON array.

#### Permissions
All users can use JSON table component.

---

### Chart

#### Purpose
Data visualization using Highcharts.

#### Placement
- "Chart" block in "Extra" category

#### Related Files
- `js/highchart/custom_chart_nd_common_json.js` - Chart component
- `js/liveLineChartComponent.js` - Live line chart

#### Usage
Drag chart block, select type, bind data source.

#### Editable Properties
- Chart type (pie, line, column, bar, donut, etc.)
- Data source path (my-input-json)
- Chart title
- Title alignment
- Dimensions
- Color scheme
- 3D settings (for 3D types)

#### Non-Editable Properties
- Internal Highcharts instance
- Rendering state

#### Interactions
- Live chart rendering
- Interactive tooltips
- Export to image

#### Backend Relation
Chart data sent with export payload.

#### Rendering Behavior
Highcharts SVG/canvas rendering.

#### Export Behavior
Chart frozen to image for PDF.

#### Dynamic Data Behavior
Series data from JSON array.

#### Permissions
All users can use chart component.

---

### Formatted Rich Text

#### Purpose
Text with number/currency/date formatting and formulas.

#### Placement
- "Formatted Text" block in "Basic" category

#### Related Files
- `js/format_text.js` - Formatted text component

#### Usage
Drag formatted text block, configure format type and pattern.

#### Editable Properties
- Format type (text, number, currency, date)
- Format pattern
- Data source path (my-input-json)
- Formula support

#### Non-Editable Properties
- Formula engine state

#### Interactions
- Real-time formatting
- Formula evaluation
- RTE editing mode

#### Backend Relation
Data sent with export payload.

#### Rendering Behavior
Formatted text display with styles.

#### Export Behavior
Formatted value preserved in export.

#### Dynamic Data Behavior
Value from JSON, formatted on render.

#### Permissions
All users can use formatted text component.

---

## Interactive Components

### QR/Barcode

#### Purpose
Generate QR codes or barcodes from data.

#### Placement
- "QR/Barcode" block in "Basic" category

#### Related Files
- `js/qr-barcode.js` - QR/Barcode component

#### Usage
Drag QR/Barcode block, configure type and data.

#### Editable Properties
- Type (QR, Code128, Code39, EAN, etc.)
- Data source path (my-input-json)
- Custom text
- Width/height
- Error correction level (QR)
- Show text label

#### Non-Editable Properties
- Internal barcode state

#### Interactions
- Live preview
- Edit button opens configuration modal

#### Backend Relation
Data sent with export payload.

#### Rendering Behavior
QRCode.js or JsBarcode rendering.

#### Export Behavior
Rendered as image in export.

#### Dynamic Data Behavior
Value from JSON path or custom text.

#### Permissions
All users can use QR/Barcode component.

---

### Table of Contents

#### Purpose
Auto-generated navigation from headings.

#### Placement
- "Table of Contents" block in "Basic" category

#### Related Files
- `js/tableOfContents.js` - TOC component

#### Usage
Drag TOC block, configure style and levels.

#### Editable Properties
- List type (ordered/unordered)
- TOC style (classic, modern, boxed)
- Include levels (H1-H7)
- Tab leader (dots, dashes, solid, none)
- Page number alignment
- Spacing per level
- Clickable headings
- Show page numbers

#### Non-Editable Properties
- Internal TOC state

#### Interactions
- Auto-generates from headings
- Click to navigate to heading
- Updates on heading change

#### Backend Relation
None

#### Rendering Behavior
Dynamic list generation from heading components.

#### Export Behavior
TOC preserved in export with page numbers.

#### Dynamic Data Behavior
None (generated from static headings)

#### Permissions
All users can use TOC component.

---

### Countdown Timer

#### Purpose
Countdown timer display.

#### Placement
- "Countdown" block in "Extra" category

#### Related Files
- `js/countdown.js` - Countdown component

#### Usage
Drag countdown block, configure target date/time.

#### Editable Properties
- Target date/time
- Format
- On-complete action
- Styling

#### Non-Editable Properties
- Timer state

#### Interactions
- Real-time countdown
- Triggers action on complete

#### Backend Relation
None

#### Rendering Behavior
JavaScript timer with text display.

#### Export Behavior
Static snapshot at export time.

#### Dynamic Data Behavior
Can bind target date from JSON.

#### Permissions
All users can use countdown component.

---

### Marquee

#### Purpose
Scrolling text banner.

#### Placement
- "Marquee" block in "Extra" category

#### Related Files
- `js/marqee-tag.js` - Marquee component

#### Usage
Drag marquee block, configure text and speed.

#### Editable Properties
- Text content
- Scroll speed
- Direction
- Background color
- Text color

#### Non-Editable Properties
- Animation state

#### Interactions
- Continuous scrolling animation

#### Backend Relation
None

#### Rendering Behavior
CSS or JavaScript animation.

#### Export Behavior
Static snapshot at export time.

#### Dynamic Data Behavior
Can bind text from JSON.

#### Permissions
All users can use marquee component.

---

### Carousel

#### Purpose
Image/content slider.

#### Placement
- "Carousel" block in "Extra" category

#### Related Files
- `js/custom-carousel.js` - Carousel component

#### Usage
Drag carousel block, add slides, configure navigation.

#### Editable Properties
- Slide content
- Auto-play interval
- Navigation arrows
- Pagination dots
- Transition effect

#### Non-Editable Properties
- Current slide index
- Auto-play state

#### Interactions
- Slide navigation
- Auto-play
- Touch/swipe support

#### Backend Relation
None

#### Rendering Behavior
JavaScript-driven slider.

#### Export Behavior
First slide shown in export.

#### Dynamic Data Behavior
Slides can bind from JSON array.

#### Permissions
All users can use carousel component.

---

### Tabs

#### Purpose
Tabbed content interface.

#### Placement
- "Tabs" block in "Extra" category

#### Related Files
- `js/tabs.js` - Tabs component
- `js/custom-tab-with-nav.js` - Tabs with navigation

#### Usage
Drag tabs block, add tab panes, configure labels.

#### Editable Properties
- Tab labels
- Tab content
- Active tab
- Tab position (top/bottom/left/right)

#### Non-Editable Properties
- Active tab state

#### Interactions
- Tab switching
- Keyboard navigation

#### Backend Relation
None

#### Rendering Behavior
JavaScript tab switching.

#### Export Behavior
All tabs visible in export (accordion style).

#### Dynamic Data Behavior
Tabs can bind from JSON array.

#### Permissions
All users can use tabs component.

---

## Advanced Components

### Subreport

#### Purpose
Embed external report templates.

#### Placement
- "Subreport" block in "Extra" category

#### Related Files
- `js/subreport.js` - Subreport component

#### Usage
Drag subreport block, double-click to select template.

#### Editable Properties
- Template file path
- Filter column
- Filter value
- Merge header/footer
- Share page number

#### Non-Editable Properties
- Loaded template content
- Internal subreport state

#### Interactions
- Double-click to select template
- Template loading from API
- Header/footer merging

#### Backend Relation
Fetches template from `/api/getTemplate/:id`

#### Rendering Behavior
Template content injected into container.

#### Export Behavior
Subreport content expanded in export.

#### Dynamic Data Behavior
Can filter subreport data from JSON.

#### Permissions
All users can use subreport component.

---

### Drawing Canvas

#### Purpose
Freehand drawing area.

#### Placement
- "Drawing" block in "Extra" category

#### Related Files
- `js/drawingTool.js` - Drawing component

#### Usage
Drag drawing block, draw with mouse/touch.

#### Editable Properties
- Brush color
- Brush size
- Canvas size
- Background color

#### Non-Editable Properties
- Drawing state
- Canvas context

#### Interactions
- Mouse/touch drawing
- Clear canvas
- Save as image

#### Backend Relation
Drawing sent as image in export.

#### Rendering Behavior
HTML5 canvas with drawing overlay.

#### Export Behavior
Canvas converted to image in export.

#### Dynamic Data Behavior
None

#### Permissions
All users can use drawing component.

---

### Code Editor

#### Purpose
Display code snippets with syntax highlighting.

#### Placement
- "Code Editor" block in "Extra" category

#### Related Files
- `js/codeEditor.js` - Code editor component

#### Usage
Drag code editor block, enter code, select language.

#### Editable Properties
- Code content
- Language (JavaScript, HTML, CSS, etc.)
- Theme
- Line numbers
- Read-only mode

#### Non-Editable Properties
- Editor state

#### Interactions
- Syntax highlighting
- Code editing

#### Backend Relation
None

#### Rendering Behavior
CodeMirror or similar editor.

#### Export Behavior
Code displayed as formatted text.

#### Dynamic Data Behavior
Can bind code content from JSON.

#### Permissions
All users can use code editor component.

---

### Separator

#### Purpose
Horizontal/vertical divider line.

#### Placement
- "Separator" block in "Extra" category

#### Related Files
- `js/custom_separator.js` - Separator component

#### Usage
Drag separator block, configure style.

#### Editable Properties
- Orientation (horizontal/vertical)
- Line style (solid, dashed, dotted)
- Color
- Thickness
- Margin

#### Non-Editable Properties
- None

#### Interactions
- Visual separator only

#### Backend Relation
None

#### Rendering Behavior
HTML hr or div with border.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
None

#### Permissions
All users can use separator component.

---

### Custom Shapes

#### Purpose
SVG shape elements (circles, rectangles, etc.).

#### Placement
- "Shapes" block in "Extra" category

#### Related Files
- `js/custom-shapes.js` - Shapes component

#### Usage
Drag shape block, select shape type, configure.

#### Editable Properties
- Shape type (circle, rectangle, triangle, etc.)
- Fill color
- Stroke color
- Stroke width
- Dimensions

#### Non-Editable Properties
- SVG state

#### Interactions
- Resize handles
- Style manager

#### Backend Relation
None

#### Rendering Behavior
Inline SVG element.

#### Export Behavior
Preserved in all formats.

#### Dynamic Data Behavior
Can bind colors from JSON.

#### Permissions
All users can use shapes component.

---

### Navbar

#### Purpose
Navigation bar component.

#### Placement
- "Navbar" block in "Extra" category

#### Related Files
- `js/navbar.js` - Navbar component

#### Usage
Drag navbar block, add links/logo.

#### Editable Properties
- Logo/image
- Navigation links
- Background color
- Text color
- Height

#### Non-Editable Properties
- Navigation state

#### Interactions
- Link navigation
- Responsive menu

#### Backend Relation
None

#### Rendering Behavior
HTML nav with flexbox layout.

#### Export Behavior
Preserved in HTML export.

#### Dynamic Data Behavior
Links can bind from JSON.

#### Permissions
All users can use navbar component.

---

### Back Button

#### Purpose
Navigation back button.

#### Placement
- "Back Button" block in "Extra" category

#### Related Files
- `js/backbutton.js` - Back button component

#### Usage
Drag back button block, configure action.

#### Editable Properties
- Button text
- Action (back, custom URL)
- Styling

#### Non-Editable Properties
- Button state

#### Interactions
- Click to navigate

#### Backend Relation
None

#### Rendering Behavior
HTML button with onclick handler.

#### Export Behavior
Button preserved in HTML export.

#### Dynamic Data Behavior
Can bind URL from JSON.

#### Permissions
All users can use back button component.

---

## Utility Components

### Hide on Print

#### Purpose
Hide components in print/PDF output.

#### Placement
- Trait on any component

#### Related Files
- `js/hide-on-print.js` - Hide on print plugin

#### Usage
Enable "Hide on print" trait on component.

#### Editable Properties
- hideOnPrint checkbox

#### Non-Editable Properties
- CSS class state

#### Interactions
- CSS class toggling
- Print media query

#### Backend Relation
None

#### Rendering Behavior
Visible in editor, hidden in print.

#### Export Behavior
Excluded from PDF export.

#### Dynamic Data Behavior
None

#### Permissions
All users can use hide on print.

---

### Custom Code

#### Purpose
Inject custom JavaScript/CSS.

#### Placement
- "Custom Code" block in "Extra" category

#### Related Files
- `js/customCode.js` - Custom code component

#### Usage
Drag custom code block, enter code.

#### Editable Properties
- JavaScript code
- CSS code
- HTML code

#### Non-Editable Properties
- Code execution state

#### Interactions
- Code injection into canvas
- CSS injection into head

#### Backend Relation
None

#### Rendering Behavior
Code executed in canvas context.

#### Export Behavior
Code included in HTML export.

#### Dynamic Data Behavior
None

#### Permissions
All users can use custom code.

---

### Background Audio

#### Purpose
Background audio for slideshow mode.

#### Placement
- "Background Music" block in "Extra" category

#### Related Files
- `js/background-audio.js` - Background audio component

#### Usage
Drag background audio block, configure audio source.

#### Editable Properties
- Audio URL
- Auto-play
- Loop
- Volume

#### Non-Editable Properties
- Audio player state

#### Interactions
- Audio playback
- Volume control

#### Backend Relation
Audio URL referenced in export.

#### Rendering Behavior
HTML5 audio element.

#### Export Behavior
Audio player preserved in HTML export.

#### Dynamic Data Behavior
Can bind audio URL from JSON.

#### Permissions
All users can use background audio component.

---

### Loading Page

#### Purpose
Loading screen during report generation.

#### Placement
- "Loading Page" block in "Extra" category

#### Related Files
- `js/custom-loading-page.js` - Loading component

#### Usage
Drag loading page block, configure message.

#### Editable Properties
- Loading message
- Spinner type
- Background color
- Text color

#### Non-Editable Properties
- Loading state

#### Interactions
- Show/hide programmatically

#### Backend Relation
None

#### Rendering Behavior
Overlay with spinner.

#### Export Behavior
Not included in export.

#### Dynamic Data Behavior
None

#### Permissions
All users can use loading page component.

---

## Component Registration Pattern

### Standard Registration
```javascript
function myComponent(editor) {
  editor.BlockManager.add('my-component', {
    label: 'My Component',
    category: 'Basic',
    content: { type: 'my-component' }
  });

  editor.DomComponents.addType('my-component', {
    model: {
      defaults: {
        traits: [/* trait definitions */],
        styles: { /* default styles */ }
      },
      init() {
        // Component initialization
      }
    },
    view: {
      onRender() {
        // View rendering
      }
    }
  });
}
```

### Plugin Registration
```javascript
// In main.js
plugins: [
  myComponent,
  // ... other plugins
]
```

### Trait Definition
```javascript
traits: [
  {
    type: 'text',
    name: 'my-input-json',
    label: 'DataSource Path',
    changeProp: 1
  },
  {
    type: 'select',
    name: 'my-select',
    label: 'Select Option',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ],
    changeProp: 1
  }
]
```