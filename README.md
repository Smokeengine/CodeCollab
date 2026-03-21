# CollabCode

A real-time collaborative code editor built with React, TypeScript, Monaco Editor, Yjs CRDTs, and Socket.io. Write and run code together with your team in real time.

🌐 **Live Demo:** [code-collab-gilt.vercel.app](https://code-collab-gilt.vercel.app)

---

## Features

- **Real-time collaboration** — Multiple users can edit the same document simultaneously using Yjs CRDTs (Conflict-free Replicated Data Types)
- **Monaco Editor** — The same editor that powers VS Code, with full syntax highlighting and IntelliSense
- **Code execution** — Run JavaScript in the browser and Python, TypeScript, Go, Rust, C++, and Java via Judge0 API
- **Document management** — Create, rename, and delete CODE and MARKDOWN documents
- **Permissions system** — Share documents with VIEWER or EDITOR roles via shareable links
- **Real-time chat** — Communicate with collaborators without leaving the editor
- **Avatar upload** — Upload profile pictures via Cloudinary
- **JWT Authentication** — Secure register and login flow

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + TypeScript | UI framework |
| Vite | Build tool |
| Monaco Editor | Code editor |
| Yjs | CRDTs for real-time sync |
| Socket.io-client | WebSocket connection |
| Tailwind CSS | Styling |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | Real-time WebSocket server |
| Prisma ORM v7 | Database ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| Cloudinary | Avatar image storage |
| Judge0 API | Remote code execution |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Railway | Backend + PostgreSQL hosting |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client (Vercel)                  │
│                                                      │
│  Monaco Editor ←→ Yjs (CRDT) ←→ Socket.io-client   │
│                                                      │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket + REST
┌──────────────────────▼──────────────────────────────┐
│                   Server (Railway)                   │
│                                                      │
│  Express REST API + Socket.io Server                 │
│  Prisma ORM → PostgreSQL                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Real-time Sync Flow
```
User A types → Monaco onDidChangeContent
            → Yjs transact (origin: 'local')
            → Socket.io emit 'doc-update'
            → Server broadcasts to room
            → User B receives update
            → Yjs applyUpdate
            → yText.observe fires
            → Monaco model.setValue
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudinary account
- Judge0 API key (RapidAPI)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/Smokeengine/CodeCollab.git
cd CodeCollab
```

**2. Setup the backend**
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/CodeCollab_db
secretKey=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run migrations and start the server:
```bash
npx prisma generate
npx prisma migrate deploy
node app.js
```

**3. Setup the frontend**
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:4000
VITE_JUDGE0_KEY=your_rapidapi_judge0_key
```

Start the dev server:
```bash
npm run dev
```

---

## Database Schema

```prisma
model User {
  id            String                  @id @default(cuid())
  firstname     String
  lastname      String
  email         String                  @unique
  password      String
  avatarUrl     String?
  documents     Document[]
  collaborations DocumentCollaborator[]
}

model Document {
  id            String                  @id @default(cuid())
  title         String
  type          DocumentType
  language      String?
  content       String?
  ownerId       String
  owner         User                    @relation(fields: [ownerId], references: [id])
  collaborators DocumentCollaborator[]
}

model DocumentCollaborator {
  id         String   @id @default(cuid())
  documentId String
  userId     String
  role       Role
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])
}

enum DocumentType { CODE MARKDOWN }
enum Role        { OWNER EDITOR VIEWER }
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and get JWT token |
| GET | `/api/me` | Get current user profile |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/document` | Create a new document |
| GET | `/api/documents` | Get all user documents |
| GET | `/api/documents/:id` | Get document by ID + user role |
| PATCH | `/api/documents/:id` | Update document title or content |
| DELETE | `/api/documents/:id` | Delete a document |

### Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/:id/share` | Generate a share link with role |
| GET | `/api/join/:token` | Join document via share token |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/avatar` | Upload avatar to Cloudinary |

---

## Key Implementation Details

### Yjs CRDT Integration
CollabCode uses Yjs for conflict-free real-time editing. Each document has a `Y.Doc` instance with a `Y.Text` shared type bound to Monaco Editor. A `suppressRef` flag prevents circular updates between Monaco and Yjs:

```typescript
// Monaco → Yjs
model.onDidChangeContent(() => {
  if (suppressRef.current) return;
  suppressRef.current = true;
  ydoc.transact(() => {
    yText.delete(0, yText.length);
    yText.insert(0, editor.getValue());
  }, 'local');
  suppressRef.current = false;
});

// Yjs → Monaco (remote changes only)
yText.observe((event, transaction) => {
  if (transaction.origin === 'local') return;
  if (suppressRef.current) return;
  suppressRef.current = true;
  model.setValue(yText.toString());
  suppressRef.current = false;
});
```

### Permission System
Document access is determined on every GET request:
- **OWNER** — full access, can share, save, run, and delete
- **EDITOR** — can edit and run code, cannot share
- **VIEWER** — read-only Monaco, no Save/Run/Share buttons

---

## Screenshots

> Add screenshots here

---

## Roadmap

- [ ] Markdown preview mode
- [ ] Version history / document snapshots  
- [ ] Live cursors showing collaborator positions
- [ ] Multiple file support per project
- [ ] Terminal integration

---

## License

MIT

---

## Author

**Anurag Vemula**  
[LinkedIn](https://linkedin.com/in/anuragvemula) · [GitHub](https://github.com/Smokeengine) · [Portfolio](https://anuragvemula.dev)
