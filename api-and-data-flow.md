# API and Data Flow

## API Structure

### Base Configuration
- **Base URL**: `http://103.75.226.215:8081/api` (from `js/apiConfig.js`)
- **Video API URL**: `http://103.75.226.215:8081/api` (same as base)
- **Protocol**: HTTP
- **Authentication**: None (public endpoints)

### Endpoints

#### Template Management
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/getTemplate` | List all templates | - | Array of template objects |
| GET | `/api/getTemplate/:id` | Get specific template | - | Template object (JSON) |
| POST | `/api/saveTemplate` | Save template (inferred) | Template JSON | Saved template object |
| DELETE | `/api/deleteTemplate/:id` | Delete template | - | Success/error |

#### Export Operations
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/uploadPdf` | Bulk export to PDF | FormData (HTML + JSON files) | ZIP archive |
| POST | `/api/uploadHtml` | Bulk export to HTML | FormData (HTML + JSON files) | ZIP archive |
| POST | `/api/uploadHtmlToPdf` | Server-side PDF generation | HTML string | PDF blob |

#### Health Check
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/health` | Server health check | - | `{ ok: true }` |

#### Vendor Files (Static)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/vendor/highstock.js` | Highcharts core | - | JavaScript file |
| GET | `/vendor/highcharts-3d.js` | Highcharts 3D | - | JavaScript file |
| GET | `/vendor/highcharts-more.js` | Highcharts more | - | JavaScript file |
| GET | `/vendor/modules/data.js` | Data module | - | JavaScript file |
| GET | `/vendor/modules/exporting.js` | Exporting module | - | JavaScript file |
| GET | `/vendor/modules/accessibility.js` | Accessibility module | - | JavaScript file |
| GET | `/vendor/modules/drilldown.js` | Drilldown module | - | JavaScript file |

---

## Client-Server Communication

### Request Format

#### Template Request
```javascript
// Get all templates
fetch(`${API_BASE_URL}/getTemplate`)
  .then(res => res.json())
  .then(templates => { /* handle */ });

// Get specific template
fetch(`${API_BASE_URL}/getTemplate/${templateId}`)
  .then(res => res.json())
  .then(template => { /* handle */ });
```

#### Export Request
```javascript
// Bulk export
const formData = new FormData();
formData.append('html', htmlContent);
formData.append('payload', JSON.stringify(payload));
jsonFiles.forEach(file => {
  formData.append('files', file);
});

fetch(`${API_BASE_URL}/uploadPdf`, {
  method: 'POST',
  body: formData
})
  .then(res => res.blob())
  .then(blob => { /* download */ });
```

### Response Format

#### Template Response
```json
[
  {
    "id": "123",
    "name": "Sample Report",
    "content": { /* GrapesJS JSON */ },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Export Response
- Content-Type: `application/zip` (bulk export)
- Content-Type: `application/pdf` (single PDF)
- Content-Disposition: `attachment; filename="export.zip"`

---

## Queues/Workers

### Current Implementation
- **No message queue system** in current codebase
- **No background workers** for async processing
- All requests are synchronous HTTP requests

### Export Processing
- Puppeteer rendering happens synchronously on server
- No job queue for large batch exports
- Timeout: 60s for chart rendering
- File processing: Memory-based (no disk I/O)

### Potential Improvements (for Next.js implementation)
- Implement Bull/Agenda for job queues
- Add Redis for queue management
- Implement worker processes for PDF generation
- Add retry logic for failed exports

---

## Export Services

### Server-Side PDF Generation
**Location**: `backend-reference/server.js`

#### Puppeteer Configuration
```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

#### Chart Rendering
- Waits for Highcharts to render (max 60s)
- Freezes charts to images before PDF generation
- Replaces Highcharts CDN URLs with local vendor files

#### PDF Generation Flow
```
1. Receive HTML string
2. Replace Highcharts URLs with local paths
3. Inject bulk runtime script (JSON data)
4. Launch Puppeteer
5. Load HTML in headless browser
6. Wait for charts to render
7. Freeze charts to images
8. Generate PDF
9. Close browser
10. Return PDF blob
```

### Bulk Export Service
**Location**: `backend-reference/server.js L327+`

#### Archive Generation
```javascript
const archive = archiver('zip', { zlib: { level: 9 } });
archive.pipe(res);
// Add files to archive
archive.finalize();
```

#### Filename Resolution
- Configured via `file_name` mapping in payload
- Fallback to original filename
- Sanitization: Remove invalid characters, replace spaces

#### Flow
```
1. Receive FormData with HTML + JSON files + payload
2. Parse JSON files
3. For each JSON object:
   a. Resolve filename from mapping or fallback
   b. Prepare HTML with JSON data injection
   c. Generate PDF/HTML
   d. Add to archive with resolved filename
4. Stream archive to response
```

---

## Database Relations

### Current Implementation
- **No database** in current backend
- Templates stored in memory or file system (not specified)
- No ORM or database client

### Data Storage
- Templates: Likely file-based or in-memory
- No user management
- No session storage
- No audit logs in database

### Next.js Implementation with Prisma
**Proposed Schema**:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  templates Template[]
}

model Template {
  id        String   @id @default(uuid())
  name      String
  content   Json     // GrapesJS JSON
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  exports   Export[]
}

model Export {
  id         String   @id @default(uuid())
  templateId String
  template   Template @relation(fields: [templateId], references: [id])
  format     String   // PDF, HTML, DOCX, etc.
  filename   String
  status     String   // pending, completed, failed
  createdAt  DateTime @default(now())
  completedAt DateTime?
}

model Datasource {
  id        String   @id @default(uuid())
  name      String
  content   Json     // JSON/XML data
  userId    String
  createdAt DateTime @default(now())
}
```

---

## Template Storage

### Current Implementation
- **Server-side**: File-based or in-memory (not specified)
- **Client-side**: IndexedDB (TemplateEditorDB)
- **Client-side**: LocalStorage for metadata

### IndexedDB Schema
- **Database**: TemplateEditorDB
- **Version**: 1
- **Store**: pages (key-value pairs for page content)

### LocalStorage Keys
- `editTemplateName` - Current template name
- `editTemplateId` - Current template ID
- `common_json` - Datasource JSON
- `common_json_files` - Datasource file list
- `common_json_file_name` - Datasource filename

### Next.js Implementation
- **Database**: PostgreSQL via Prisma
- **Storage**: S3 or similar for large JSON files
- **Cache**: Redis for frequently accessed templates
- **CDN**: CloudFront for static assets

---

## Asset Handling

### Current Implementation
- **Uploads**: Via FormData to export endpoints
- **Storage**: Memory-based on server (multer)
- **Client**: Base64 encoding or URL references
- **No dedicated asset storage API**

### Asset Types
- Images (PNG, JPG, etc.)
- Videos (MP4, etc.)
- JSON/XML datasources
- Custom fonts

### Next.js Implementation
- **Storage**: S3 or similar object storage
- **Upload API**: Dedicated endpoint for asset upload
- **CDN**: CloudFront for asset delivery
- **Optimization**: Image/video optimization pipeline
- **Caching**: Browser + CDN caching

---

## Auth Flow

### Current Implementation
- **No authentication** in current codebase
- **No user management**
- **No session handling**
- **No permission system**

### Next.js Implementation with NextAuth.js
```javascript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Verify user with Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (user && verifyPassword(credentials.password, user.password)) {
          return user;
        }
        return null;
      }
    })
  ],
  session: { strategy: 'jwt' }
};

export default NextAuth(authOptions);
```

### Permission System
```prisma
model Permission {
  id        String   @id @default(uuid())
  name      String   @unique
  users     UserPermission[]
}

model UserPermission {
  id           String     @id @default(uuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id])
}

model User {
  id          String          @id @default(uuid())
  email       String          @unique
  permissions UserPermission[]
}
```

---

## WebSocket/Collaboration Flow

### Current Implementation
- **No WebSocket** support
- **No real-time collaboration**
- **No live editing**

### Next.js Implementation with Pusher/Socket.io
```typescript
// app/api/collaboration/route.ts
import { Server } from 'socket.io';
import { NextApiRequest } from 'next';

export default function handler(req: NextApiRequest, res: any) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    socket.on('join-template', (templateId) => {
      socket.join(templateId);
    });

    socket.on('component-update', (data) => {
      socket.to(data.templateId).emit('component-update', data);
    });
  });

  res.end();
}
```

### Collaboration Events
- `join-template` - User joins template editing
- `component-update` - Component changed
- `cursor-move` - Cursor position update
- `user-join` - User joined session
- `user-leave` - User left session

---

## Caching Strategy

### Current Implementation
- **No server-side caching**
- **Browser caching** via CDN for libraries
- **LocalStorage** for client-side data
- **IndexedDB** for page content

### Next.js Implementation

#### Server-Side Caching
```typescript
// Cache template content
import { unstable_cache } from 'next/cache';

const getTemplate = unstable_cache(
  async (id: string) => {
    return await prisma.template.findUnique({ where: { id } });
  },
  ['template'],
  { revalidate: 3600 } // 1 hour
);
```

#### Redis Caching
```typescript
// Cache frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedTemplate(id: string) {
  const cached = await redis.get(`template:${id}`);
  if (cached) return JSON.parse(cached);

  const template = await prisma.template.findUnique({ where: { id } });
  await redis.setex(`template:${id}`, 3600, JSON.stringify(template));
  return template;
}
```

#### CDN Caching
- Static assets: 1 year cache
- HTML: 1 hour cache
- API responses: 5 minute cache

---

## Data Flow Diagrams

### Template Load Flow
```
User Action
  → Click "Load Template"
    → GET /api/getTemplate/:id
      → Database query
        → Return template JSON
          → Parse JSON
            → Load into GrapesJS
              → Render in canvas
```

### Datasource Upload Flow
```
User Action
  → Upload JSON/XML file
    → FileReader API
      → Parse content
        → Validate structure
          → Store in uploadedJsonFiles
            → Trigger rebind event
              → Update components
```

### Export Flow
```
User Action
  → Click "Export PDF"
    → Capture HTML snapshot
      → Sync form state
        → Freeze charts
          → POST /api/uploadHtmlToPdf
            → Puppeteer rendering
              → Generate PDF
                → Return blob
                  → Download to client
```

### Bulk Export Flow
```
User Action
  → Click "Bulk Export"
    → Open modal
      → Upload JSON/XML files
        → Map fields
          → Configure filename
            → POST /api/uploadPdf
              → Parse JSON files
                → For each record:
                  → Prepare HTML
                    → Generate PDF
                      → Add to archive
                        → Stream ZIP
                          → Download to client
```

---

## Error Handling

### Current Implementation
- **Custom error logger**: `js/custom_errorlogger.js`
- **Console logging**: Standard console.error
- **Toast notifications**: User feedback
- **No structured error responses**

### Next.js Implementation
```typescript
// app/api/error-handler.ts
import { NextResponse } from 'next/server';

export function handleError(error: any) {
  console.error('API Error:', error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: 'Database error', code: error.code },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Error Types
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Database errors (500)
- Export generation errors (500)

---

## Rate Limiting

### Current Implementation
- **No rate limiting**
- No request throttling
- No DDoS protection

### Next.js Implementation
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

---

## Monitoring

### Current Implementation
- **No monitoring**
- **No logging service**
- **No analytics**

### Next.js Implementation
- **Logging**: Winston/Pino
- **Metrics**: Prometheus
- **Tracing**: OpenTelemetry
- **Error tracking**: Sentry
- **APM**: Datadog/New Relic

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```