# Quick Start Guide - CCPM Dropshipping Platform

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Overview

### Key Files
- **Configuration**: `next.config.js`, `tailwind.config.js`, `tsconfig.json`
- **Environment**: `.env.local` (create from `.env.example`)
- **Layout**: `components/layout/*` (sidebar, header, footer, breadcrumbs)
- **Pages**: `app/` directory (Next.js App Router)
- **Utilities**: `lib/utils.ts`, `lib/env.ts`

### Path Aliases
Use `@/` to import from root:
```tsx
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
```

## Common Tasks

### Add a New Page
```bash
# Create file: app/(dashboard)/your-page/page.tsx
```
```tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  )
}
```

### Add a shadcn/ui Component
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

### Add a Protected Page
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function SecretPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <div>Protected content</div>
    </ProtectedRoute>
  )
}
```

### Format Code
```bash
npm run format        # Format all files
npm run format:check  # Check formatting
npm run lint          # Run ESLint
npm run type-check    # Check TypeScript
```

### Build for Production
```bash
npm run build
npm run start
```

## Project Structure

```
app/
├── (auth)/login/      # Login page (no layout)
├── (dashboard)/       # Dashboard pages (with sidebar layout)
│   ├── layout.tsx     # Dashboard layout
│   └── page.tsx       # Dashboard home
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── page.tsx           # Landing page (redirects to dashboard)

components/
├── auth/              # Auth components
│   └── protected-route.tsx
├── layout/            # Layout components
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── footer.tsx
│   └── breadcrumbs.tsx
└── ui/                # shadcn/ui components (add as needed)

lib/
├── env.ts            # Environment validation
└── utils.ts          # Utility functions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type checking |

## Helpful Resources

- **Next.js Docs**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Project Details**: See `PROJECT_SETUP.md`

## Integration Notes

### Authentication (Stream B)
The protected route HOC is ready at `components/auth/protected-route.tsx`.
Replace the placeholder authentication logic with actual JWT validation.

### Database (Stream A)
Prisma schema is set up. Use Prisma Client in API routes and server components.

### CI/CD (Stream D)
Build passes all checks. Ready for deployment configuration.

## Need Help?

- Check `PROJECT_SETUP.md` for detailed configuration
- Check `.claude/epics/dropshipping-platform/updates/2/stream-c.md` for progress
- Review component code in `components/` directory
