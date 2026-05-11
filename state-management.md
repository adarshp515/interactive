# State Management

## Overview

The application uses a hybrid state management approach combining:
- GrapesJS internal state (component models)
- Global variables (window object)
- LocalStorage for cross-session persistence
- IndexedDB for structured data storage
- Component-level state via React-like patterns

---

## Global State Variables

### Editor Instance
```javascript
// Location: js/main.js L2
window.editor = InteractiveDesigner.init({...});
```
- **Purpose**: Main editor instance
- **Scope**: Global
- **Access**: All plugins via `window.editor`
- **Lifecycle**: Created on init, destroyed on page unload

### Page Manager
```javascript
// Location: js/main.js L197
let pageManager = null;
```
- **Purpose**: Multi-page management
- **Scope**: Global
- **Access**: `window.pageManager`
- **Lifecycle**: Initialized on load, cleared on canvas clear

### Page Setup Manager
```javascript
// Location: js/main.js L198
let pageSetupManager = null;
```
- **Purpose**: Page configuration management
- **Scope**: Global
- **Access**: `window.pageSetupManager`
- **Lifecycle**: Initialized on load, reset on canvas clear

### Datasource Cache
```javascript
// Location: js/main.js L418
let uploadedJsonFiles = [];
```
- **Purpose**: Cache uploaded datasource files
- **Scope**: Global
- **Access**: `window.uploadedJsonFiles`
- **Lifecycle**: Cleared on session end, updated on upload

### Rebind Timer
```javascript
// Location: js/main.js L3947
let datasourceRebindTimer = null;
```
- **Purpose**: Debounce datasource rebind operations
- **Scope**: Global
- **Access**: Internal only
- **Lifecycle**: Created/destroyed per rebind operation

### Slideshow State
```javascript
// Location: js/main.js L4068-4071
let slides = [];
let transitions = {};
let clickStates = {};
let currentSlideIndex = 0;
```
- **Purpose**: Slideshow/presentation mode state
- **Scope**: Global
- **Access**: Internal only
- **Lifecycle**: Reset on canvas clear

### Dirty Flag
```javascript
// Location: js/main.js L4083
let hasChanges = false;
```
- **Purpose**: Track unsaved changes
- **Scope**: Global
- **Access**: Internal only
- **Lifecycle**: Set on any change, checked on beforeunload

---

## LocalStorage

### Keys and Purposes

#### Template Metadata
```javascript
localStorage.setItem('editTemplateName', templateName);
localStorage.setItem('editTemplateId', templateId);
```
- **Purpose**: Track currently editing template
- **Format**: String
- **Persistence**: Cross-session
- **Clear**: On canvas clear or template load

#### Datasource Storage
```javascript
localStorage.setItem('common_json', JSON.stringify(jsonData));
localStorage.setItem('common_json_files', JSON.stringify(fileList));
localStorage.setItem('common_json_file_name', filename);
```
- **Purpose**: Persist datasource across sessions
- **Format**: JSON string
- **Persistence**: Cross-session
- **Clear**: On canvas clear

#### Page Storage
```javascript
localStorage.setItem('single-page', JSON.stringify(pageContent));
sessionStorage.setItem('single-page', JSON.stringify(pageContent));
```
- **Purpose**: Page content persistence
- **Format**: JSON string
- **Persistence**: LocalStorage (permanent), sessionStorage (session)
- **Clear**: On canvas clear

### Usage Pattern
```javascript
// Save
localStorage.setItem('key', JSON.stringify(value));

// Load
const value = JSON.parse(localStorage.getItem('key') || 'null');

// Clear
localStorage.removeItem('key');
```

### Limitations
- **Size limit**: ~5MB per origin
- **Synchronous**: Blocks main thread
- **String-only**: Requires JSON serialization
- **No expiration**: Manual cleanup required

---

## IndexedDB

### Database Configuration
```javascript
// Location: js/page-setup-manager.js L20-22
const DB_NAME = 'TemplateEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'pages';
```

### Schema
- **Database**: TemplateEditorDB
- **Version**: 1
- **Object Store**: pages (key-value store)

### Operations

#### Open Database
```javascript
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

#### Save Page Content
```javascript
async function saveToIndexedDB(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
```

#### Load Page Content
```javascript
async function loadFromIndexedDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(tx.error);
  });
}
```

#### Clear Database
```javascript
async function clearFromIndexedDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
```

### Usage in Page Setup Manager
- **Save**: On page content change (debounced)
- **Load**: On page initialization
- **Clear**: On canvas clear event

### Advantages
- **Large storage**: ~50-250MB per origin
- **Asynchronous**: Non-blocking
- **Structured**: Supports complex data types
- **Indexes**: Efficient querying

---

## Component-Level State

### GrapesJS Component Model
Each component has its own state via GrapesJS Component model:

```javascript
const component = editor.DomComponents.getType('custom-type');
component.model = {
  defaults: {
    // Default attributes
    tagName: 'div',
    classes: ['my-class'],
    attributes: { id: 'my-id' },
    traits: [/* trait definitions */],
    styles: { /* CSS styles */ },
    // Custom properties
    customProp: 'value'
  },

  init() {
    // Component initialization
    this.on('change:customProp', this.handlePropChange);
  },

  handlePropChange() {
    // Handle property changes
  }
};
```

### State Access
```javascript
// Get component
const component = editor.getSelected();

// Get properties
const propValue = component.get('customProp');
const attrs = component.getAttributes();
const style = component.getStyle();

// Set properties
component.set('customProp', 'newValue');
component.setAttributes({ id: 'new-id' });
component.setStyle({ color: 'red' });
```

### Component Events
```javascript
component.on('change', () => {
  // Any change
});

component.on('change:attributes', () => {
  // Attributes changed
});

component.on('change:styles', () => {
  // Styles changed
});
```

---

## Page Setup Manager State

### Internal State
```javascript
class PageSetupManager {
  constructor(editor) {
    this.editor = editor;
    this.pageSettings = {
      numberOfPages: 1,
      pages: []
    };
    this.pageContents = new Map();
    this.pageObservers = new Map();
    this.debounceTimers = new Map();
    this.lastContentSnapshot = new Map();
    this.currentPageIndex = 0;
    this.pageBreaks = [];
    this.sharedContent = {
      header: null,
      footer: null
    };
    this.isInitialized = false;
  }
}
```

### State Persistence
- **IndexedDB**: Page content snapshots
- **LocalStorage**: Page metadata
- **Memory**: Current page state

### State Synchronization
```javascript
// Debounced save to IndexedDB
const saveDebounced = debounce((pageIndex, content) => {
  saveToIndexedDB(`page-${pageIndex}`, content);
}, 500);

// Observer pattern for page changes
const observer = new MutationObserver((mutations) => {
  saveDebounced(this.currentPageIndex, getPageContent());
});
```

---

## Datasource State Management

### Upload Flow
```
1. User uploads file
2. FileReader reads content
3. Parse JSON/XML
4. Validate structure
5. Add to uploadedJsonFiles array
6. Save to LocalStorage
7. Trigger rebind event
```

### Rebind Flow
```
1. Datasource changed
2. Schedule rebind (debounce 250ms)
3. Timer expires
4. Iterate all components
5. Query JSON path
6. Resolve value
7. Update component
8. Component re-render
```

### Data Resolution
```javascript
function readValueByPath(data, path) {
  const parts = path.split('.');
  let current = data;

  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}
```

---

## Event-Driven State Updates

### Custom Events

#### Datasource Update
```javascript
// Trigger
document.dispatchEvent(new CustomEvent('common-json-files-updated', {
  detail: { files: uploadedJsonFiles }
}));

// Listen
document.addEventListener('common-json-files-updated', (e) => {
  scheduleDatasourceRebind();
});
```

#### Array Data Selection
```javascript
// Trigger
document.dispatchEvent(new CustomEvent('arrayDataSelected', {
  detail: { data, jsonPath }
}));

// Listen
document.addEventListener('arrayDataSelected', (e) => {
  pageManager.handleArrayDataDistribution(e.detail.data, e.detail.jsonPath);
});
```

#### Canvas Clear
```javascript
// Trigger
document.dispatchEvent(new Event('canvasCleared'));

// Listen
document.addEventListener('canvasCleared', async () => {
  // Clear IndexedDB
  // Clear LocalStorage
  // Reset state
});
```

#### Page Setup State Change
```javascript
// Trigger
document.dispatchEvent(new CustomEvent('pageSetupStateChanged', {
  detail: { active: true }
}));

// Listen
document.addEventListener('pageSetupStateChanged', (e) => {
  updateNavbarButton();
});
```

---

## State Synchronization Patterns

### Two-Way Binding
```javascript
// Component → State
component.on('change:my-input-json', (value) => {
  updateBinding(component, value);
});

// State → Component
function updateBinding(component, value) {
  const data = readValueByPath(datasource, value);
  component.set('content', data);
}
```

### Observer Pattern
```javascript
// Register observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    handleDOMChange(mutation);
  });
});

observer.observe(element, {
  attributes: true,
  childList: true,
  subtree: true
});
```

### Pub/Sub Pattern
```javascript
// Subscribe
eventBus.on('template:changed', (template) => {
  updatePreview(template);
});

// Publish
eventBus.emit('template:changed', newTemplate);
```

---

## State Persistence Strategy

### Save Triggers
- **Manual**: User clicks "Save"
- **Auto**: On component change (debounced)
- **Periodic**: Every 30 seconds (not implemented)
- **Before unload**: If hasChanges is true

### Save Locations
- **LocalStorage**: Metadata, small data
- **IndexedDB**: Page content, large data
- **Server**: Template JSON (via API)

### Load Triggers
- **Page load**: Restore last session
- **Template load**: Load from API
- **Import**: Load from file

### Clear Triggers
- **Canvas clear**: Clear all state
- **New template**: Clear previous state
- **Logout**: Clear user-specific state

---

## State Reset and Cleanup

### Canvas Clear Flow
```javascript
document.addEventListener('canvasCleared', async () => {
  // Clear LocalStorage
  localStorage.removeItem('editTemplateName');
  localStorage.removeItem('editTemplateId');
  sessionStorage.removeItem('single-page');

  // Clear IndexedDB
  await clearFromIndexedDB('pages');

  // Clear in-memory state
  pageContents.clear();
  pageObservers.clear();
  debounceTimers.forEach(timer => clearTimeout(timer));
  lastContentSnapshot.clear();

  // Reset page setup
  currentPageIndex = 0;
  pageBreaks = [];
  sharedContent = { header: null, footer: null };
  pageSettings.numberOfPages = 1;
  pageSettings.pages = [];

  // Reset flags
  isInitialized = false;
  hasChanges = false;
});
```

### Timer Cleanup
```javascript
// Clear all timers on page unload
window.addEventListener('beforeunload', () => {
  if (datasourceRebindTimer) {
    clearTimeout(datasourceRebindTimer);
  }

  debounceTimers.forEach(timer => {
    clearTimeout(timer);
  });
});
```

### Observer Cleanup
```javascript
// Disconnect observers
pageObservers.forEach((observer) => {
  observer.disconnect();
});
pageObservers.clear();
```

---

## Next.js Implementation Recommendations

### State Management Library
- **Zustand**: Lightweight, simple API
- **Redux Toolkit**: For complex state
- **Jotai**: Atomic state management
- **React Query**: Server state + caching

### Recommended Stack
```typescript
// lib/store.ts (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  template: Template | null;
  datasource: Datasource[];
  pages: Page[];
  hasChanges: boolean;
  setTemplate: (template: Template) => void;
  setDatasource: (datasource: Datasource[]) => void;
  addPage: (page: Page) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      template: null,
      datasource: [],
      pages: [],
      hasChanges: false,
      setTemplate: (template) => set({ template, hasChanges: true }),
      setDatasource: (datasource) => set({ datasource }),
      addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
      reset: () => set({ template: null, datasource: [], pages: [], hasChanges: false }),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({ datasource: state.datasource }),
    }
  )
);
```

### Server State with React Query
```typescript
// hooks/useTemplate.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => fetchTemplate(id),
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: Template) => saveTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
```

### Database State with Prisma
```typescript
// Server actions
'use server';

import { prisma } from '@/lib/prisma';

export async function getTemplate(id: string) {
  return await prisma.template.findUnique({
    where: { id },
    include: { user: true },
  });
}

export async function saveTemplate(data: TemplateInput) {
  return await prisma.template.upsert({
    where: { id: data.id || '' },
    create: data,
    update: data,
  });
}
```

### Real-time State with Zustand + WebSockets
```typescript
// lib/realtime.ts
import { useEditorStore } from './store';

export function subscribeToTemplateUpdates(templateId: string) {
  const socket = new WebSocket(`ws://localhost:3000/ws/${templateId}`);

  socket.onmessage = (event) => {
    const update = JSON.parse(event.data);
    useEditorStore.setState((state) => ({
      template: { ...state.template, ...update },
      hasChanges: false, // Remote changes don't mark as dirty
    }));
  };

  return () => socket.close();
}
```

### IndexedDB with Dexie.js
```typescript
// lib/db.ts
import Dexie, { Table } from 'dexie';

class EditorDB extends Dexie {
  pages!: Table<PageContent, string>;
  cache!: Table<CachedItem, string>;

  constructor() {
    super('EditorDB');
    this.version(1).stores({
      pages: 'id, timestamp',
      cache: 'key, timestamp',
    });
  }
}

export const db = new EditorDB();

// Usage
await db.pages.put({ id: 'page-1', content: '...', timestamp: Date.now() });
const page = await db.pages.get('page-1');
```