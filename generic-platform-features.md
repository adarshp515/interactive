# Generic Platform Features

## Authentication

### Purpose
Basic template-level authentication via API configuration.

### Placement in UI
- Not visible in UI (server-side configuration)
- API base URL configuration

### Related Modules/Files
- `js/apiConfig.js` - API endpoint configuration
- `backend-reference/server.js` - Backend server

### Usage
System uses configured API base URL for template CRUD operations.

### Dependencies
- HTTP client (fetch API)
- API base URL constant

### Editable Properties
- `window.API_BASE_URL` - API endpoint (currently: `http://103.75.226.215:8081/api`)
- `window.API_BASE_URL_Video` - Video API endpoint

### Non-Editable/Internal Properties
- No session management
- No token-based auth
- No user roles defined

### Interactions with Other Modules
- Used by template management
- Used by subreport loading
- Used by bulk export

### Backend Relation
- No auth middleware in current implementation
- Public API endpoints
- No user authentication required

### Rendering Behavior
- No rendering (configuration only)

### Export Behavior
- Not applicable

### Dynamic Data Behavior
- Not applicable

### Permissions/Visibility Rules
- No permission system
- All endpoints publicly accessible

---

## Notifications

### Purpose
Toast notifications for user feedback (currently minimal implementation).

### Placement in UI
- Toast notifications appear at top-right of screen

### Related Modules/Files
- `js/custom-table.js` - Contains `showToast` function (L43-67)
- `js/custom_errorlogger.js` - Error logging

### Usage
System shows toast notifications for warnings, success, and error messages.

### Dependencies
- DOM manipulation
- CSS styling inline

### Editable Properties
- Message content
- Notification type (warning/success/error)
- Display duration (3000ms fixed)

### Non-Editable/Internal Properties
- Fixed position (top-right)
- Fixed z-index (10000)
- Fixed max-width (300px)

### Interactions with Other Modules
- Called by table component for validation errors
- Called by error logger
- No centralized notification system

### Backend Relation
- No backend interaction

### Rendering Behavior
- DOM element creation and removal
- CSS animations not implemented
- Simple show/hide logic

### Export Behavior
- Not applicable

### Dynamic Data Behavior
- Not applicable

### Permissions/Visibility Rules
- No restrictions
- All users see notifications

---

## Uploads

### Purpose
File upload for datasources (JSON/XML) and assets (images, videos).

### Placement in UI
- Asset manager panel
- Bulk export modal
- Component-specific upload buttons

### Related Modules/Files
- `js/main.js` - Excel/CSV upload handler
- `js/customJsonTable.js` - JSON file handling
- `js/imageEditor.js` - Image upload
- `js/custom-video-in.js` - Video upload
- Backend multer configuration

### Usage
Users upload datasources for binding, images for embedding, and videos for interactive reports.

### Dependencies
- File input elements
- FileReader API
- FormData API
- Multer (backend)

### Editable Properties
- File selection
- File type validation
- File size limits (server: 50MB per file, 200 files max)

### Non-Editable/Internal Properties
- Upload endpoint configuration
- File storage location (memory storage on server)

### Interactions with Other Modules
- Integrates with datasource binding
- Communicates with asset manager
- Triggers rebind on file upload

### Backend Relation
- `POST /api/uploadPdf` - Accepts FormData with files
- `POST /api/uploadHtml` - Accepts FormData with files
- Multer memory storage configuration

### Rendering Behavior
- File input rendering
- Upload progress not shown
- Success/error feedback via toasts

### Export Behavior
- Uploaded files sent with export payload
- Files embedded in generated archives

### Dynamic Data Behavior
- JSON/XML files parsed and cached
- Images/videos referenced by URL or base64

### Permissions/Visibility Rules
- No upload permission restrictions
- All users can upload files

---

## Workspace Management

### Purpose
Template workspace management with save/load functionality.

### Placement in UI
- "Save" and "Import" buttons in toolbar
- Template listing page (`template.html`)

### Related Modules/Files
- `js/main.js` - Save/import functions
- `template.html` - Template management interface
- IndexedDB storage

### Usage
Users save templates, load existing templates, and manage template library.

### Dependencies
- IndexedDB for local persistence
- API for server storage
- LocalStorage for metadata

### Editable Properties
- Template name
- Template ID (auto-generated)
- Template content (full JSON)

### Non-Editable/Internal Properties
- Creation timestamp
- Last modified timestamp
- Internal component IDs

### Interactions with Other Modules
- Integrates with page manager
- Communicates with export pipeline
- Syncs with component tree

### Backend Relation
- `GET /api/getTemplate` - List all templates
- `GET /api/getTemplate/:id` - Get specific template
- `POST /api/saveTemplate` - Save template (inferred)
- `DELETE /api/deleteTemplate/:id` - Delete template

### Rendering Behavior
- Template listing table with pagination
- Template loading into canvas
- Canvas rendering from saved JSON

### Export Behavior
- Template JSON included in export
- No separate export for workspace

### Dynamic Data Behavior
- Not applicable (workspace is static)

### Permissions/Visibility Rules
- No role-based permissions
- All users can access all templates
- Delete operation available to all users

---

## Themes

### Purpose
Basic styling configuration via GrapesJS style manager.

### Placement in UI
- Style manager panel (right sidebar)
- Component style properties

### Related Modules/Files
- `css/home.css` - Main stylesheet
- `css/custom.css` - Custom styles
- `js/styleBg.js` - Background styling component

### Usage
Users configure component styles via GrapesJS style manager and custom style components.

### Dependencies
- GrapesJS style manager
- CSS-in-JS for dynamic styles
- Custom style components

### Editable Properties
- Colors
- Fonts
- Spacing
- Borders
- Background images
- Custom CSS classes

### Non-Editable/Internal Properties
- System styles (Bootstrap, FontAwesome)
- Internal style injection logic

### Interactions with Other Modules
- Integrates with all components
- Communicates with export pipeline
- Style preservation in template JSON

### Backend Relation
- No backend interaction
- Styles stored in template JSON

### Rendering Behavior
- Live style preview in canvas
- CSS injection into iframe
- Style manager panel updates

### Export Behavior
- Styles included in exported HTML
- CSS preserved in template JSON

### Dynamic Data Behavior
- Not applicable (styles are static)

### Permissions/Visibility Rules
- No restrictions
- All users can modify styles

---

## Audit Logs

### Purpose
Basic error logging and activity tracking (minimal implementation).

### Placement in UI
- "Logs" button in toolbar
- `logs.html` - Logs viewing page

### Related Modules/Files
- `js/custom_errorlogger.js` - Error logging utility
- `logs.html` - Logs display interface
- Backend log endpoints (if any)

### Usage
System logs errors and activities for debugging purposes.

### Dependencies
- Console logging
- Custom error logger
- LocalStorage for log persistence

### Editable Properties
- Log level (not configurable)
- Log retention (not configurable)

### Non-Editable/Internal Properties
- Log timestamps
- Error stack traces
- Internal error codes

### Interactions with Other Modules
- Called by error-prone operations
- Integrated with export pipeline
- Monitors component lifecycle

### Backend Relation
- No dedicated log endpoint in current implementation
- Server-side console logging

### Rendering Behavior
- Log table display in logs.html
- Timestamp filtering
- Error message display

### Export Behavior
- Not applicable

### Dynamic Data Behavior
- Not applicable

### Permissions/Visibility Rules
- No restrictions
- All users can view logs

---

## Analytics

### Purpose
Not implemented in current codebase.

### Placement in UI
- N/A

### Related Modules/Files
- N/A

### Usage
- N/A

### Dependencies
- N/A

### Editable Properties
- N/A

### Non-Editable/Internal Properties
- N/A

### Interactions with Other Modules
- N/A

### Backend Relation
- N/A

### Rendering Behavior
- N/A

### Export Behavior
- N/A

### Dynamic Data Behavior
- N/A

### Permissions/Visibility Rules
- N/A

---

## Settings

### Purpose
Platform-level configuration (minimal implementation).

### Placement in UI
- Page setup toolbar
- Component trait panels
- No dedicated settings page

### Related Modules/Files
- `js/page-setup-manager.js` - Page settings
- `js/apiConfig.js` - API configuration
- Component-specific settings

### Usage
Users configure page settings, API endpoints, and component-specific options.

### Dependencies
- LocalStorage for persistence
- Component trait system
- Page setup manager

### Editable Properties
- Page dimensions and orientation
- API base URL (via code)
- Component-specific settings
- Export format preferences

### Non-Editable/Internal Properties
- System defaults
- Internal configuration constants

### Interactions with Other Modules
- Integrates with page manager
- Communicates with export pipeline
- Affects component behavior

### Backend Relation
- Settings stored client-side
- No server-side settings API

### Rendering Behavior
- Settings reflected in UI panels
- Page setup modal
- Trait panel updates

### Export Behavior
- Settings included in template JSON
- Applied during export rendering

### Dynamic Data Behavior
- Not applicable (settings are static)

### Permissions/Visibility Rules
- No restrictions
- All users can modify settings

---

## Plugin System

### Purpose
Extensible plugin architecture for adding custom components and features.

### Placement in UI
- Plugin registration in main.js initialization
- Component blocks in left panel
- Commands in toolbar

### Related Modules/Files
- `js/main.js` - Plugin registration (L15-63)
- Individual plugin files in `js/` directory
- GrapesJS plugin API

### Usage
Developers add custom components by registering plugins in the plugin array.

### Dependencies
- GrapesJS plugin API
- Component registration system
- Command registration system

### Editable Properties
- Plugin configuration via `pluginsOpts`
- Component traits and defaults
- Command handlers

### Non-Editable/Internal Properties
- Plugin load order
- Internal plugin state
- GrapesJS core hooks

### Interactions with Other Modules
- All plugins integrate with editor core
- Plugins can communicate via events
- Shared state through editor instance

### Backend Relation
- No backend interaction
- Plugins are client-side only

### Rendering Behavior
- Plugin components render in canvas
- Plugin UI in panels/toolbar
- Custom rendering logic per plugin

### Export Behavior
- Plugin components included in export
- Plugin-specific export handling
- Data capture for export

### Dynamic Data Behavior
- Plugin-specific data binding
- Plugin-specific dynamic rendering

### Permissions/Visibility Rules
- No plugin-level permissions
- All plugins available to all users

---

## Template Storage

### Purpose
Template persistence via API and local storage.

### Placement in UI
- Template listing page (`template.html`)
- Save/load buttons in toolbar

### Related Modules/Files
- `template.html` - Template management UI
- `js/main.js` - Save/load functions
- IndexedDB for local persistence
- API endpoints

### Usage
Templates are stored server-side via API and cached locally via IndexedDB.

### Dependencies
- IndexedDB (TemplateEditorDB)
- API client (fetch)
- LocalStorage for metadata

### Editable Properties
- Template name
- Template content (full JSON structure)
- Template metadata

### Non-Editable/Internal Properties
- Template ID
- Timestamps
- Internal component IDs
- IndexedDB storage keys

### Interactions with Other Modules
- Integrates with page manager
- Communicates with component tree
- Syncs with export pipeline

### Backend Relation
- `GET /api/getTemplate` - List templates
- `GET /api/getTemplate/:id` - Get template
- `POST /api/saveTemplate` - Save template (inferred)
- `DELETE /api/deleteTemplate/:id` - Delete template

### Rendering Behavior
- Template listing with pagination
- Template loading into canvas
- Canvas rendering from JSON

### Export Behavior
- Template JSON sent with export payload
- Template structure preserved in output

### Dynamic Data Behavior
- Not applicable (templates are static)

### Permissions/Visibility Rules
- No role-based permissions
- All users can access all templates

---

## Asset Handling

### Purpose
Asset management for images, videos, and other media files.

### Placement in UI
- Asset manager panel
- Component-specific asset selection
- "Select from JSON" button in asset manager

### Related Modules/Files
- `js/main.js` - Asset manager customization (L150-168)
- `js/imageEditor.js` - Image editing
- `js/custom-video-in.js` - Video handling
- `js/image-editor-component` - Image editor plugin

### Usage
Users upload and select assets for use in report templates.

### Dependencies
- GrapesJS Asset Manager
- FileReader API
- Image editing libraries
- Video player APIs

### Editable Properties
- Asset file uploads
- Asset URLs
- Image editing operations
- Video source URLs

### Non-Editable/Internal Properties
- Asset manager internal state
- Image editor state
- Video player state

### Interactions with Other Modules
- Integrates with image/video components
- Communicates with datasource binding
- Asset selection from JSON data

### Backend Relation
- No dedicated asset storage API
- Assets sent with export payload
- Base64 or URL references

### Rendering Behavior
- Asset thumbnails in manager
- Live preview in canvas
- Image editor overlay

### Export Behavior
- Assets embedded in export
- Base64 encoding for images
- URL references for videos

### Dynamic Data Behavior
- Assets can be data-bound via JSON paths
- Dynamic asset selection from datasource

### Permissions/Visibility Rules
- No restrictions
- All users can upload and use assets