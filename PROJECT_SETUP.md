# CCPM Dropshipping Platform - Project Setup Summary

## Overview
This document provides a comprehensive overview of the Next.js 14+ project setup completed for the CCPM Dropshipping Platform (Issue #2, Stream C).

## Technology Stack

### Core Framework
- **Next.js**: 14.2.5 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.5.4 (strict mode)
- **Node.js**: 20+

### Styling & UI
- **TailwindCSS**: 3.4.7
- **PostCSS**: 8.4.40
- **Autoprefixer**: 10.4.19
- **tailwindcss-animate**: 1.0.7
- **Lucide React**: 0.424.0 (icons)
- **shadcn/ui**: Ready for component installation

### Development Tools
- **ESLint**: 8.57.0 with Next.js config
- **Prettier**: 3.3.3 with Tailwind plugin
- **TypeScript ESLint**: Configured

### Validation & Utils
- **Zod**: 3.23.8 (schema validation)
- **clsx**: 2.1.1 (conditional classes)
- **tailwind-merge**: 2.4.0 (class merging)
- **class-variance-authority**: 0.7.0 (component variants)

## Project Structure

```
/home/tatofasan/Proyectos/CCPM/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group (no layout)
│   │   └── login/
│   │       └── page.tsx           # Login page
│   ├── (dashboard)/               # Dashboard route group (with layout)
│   │   ├── layout.tsx             # Dashboard layout (sidebar + header + footer)
│   │   └── page.tsx               # Dashboard home page
│   ├── globals.css                # Global styles + Tailwind + CSS variables
│   ├── layout.tsx                 # Root layout (HTML wrapper)
│   └── page.tsx                   # Root page (redirects to /dashboard)
│
├── components/                    # React components
│   ├── auth/
│   │   └── protected-route.tsx    # HOC for protected routes
│   ├── layout/
│   │   ├── breadcrumbs.tsx        # Breadcrumb navigation
│   │   ├── footer.tsx             # Page footer
│   │   ├── header.tsx             # Header with notifications & user menu
│   │   └── sidebar.tsx            # Responsive sidebar navigation
│   └── ui/                        # Reserved for shadcn/ui components
│
├── lib/                           # Utility functions and helpers
│   ├── env.ts                     # Environment variable validation (Zod)
│   └── utils.ts                   # Utility functions (cn, formatters, etc.)
│
├── .claude/                       # CCPM project management
│   └── epics/dropshipping-platform/
│       └── updates/2/
│           └── stream-c.md        # This stream's progress
│
├── .env.example                   # Environment variables template
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .prettierignore                # Prettier ignore patterns
├── components.json                # shadcn/ui configuration
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # TailwindCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── PROJECT_SETUP.md               # This file
```

## Configuration Details

### TypeScript Configuration (tsconfig.json)
- Strict mode enabled
- Path alias: `@/*` → root directory
- Target: ESNext with bundler module resolution
- JSX: preserve (handled by Next.js)

### Tailwind Configuration (tailwind.config.js)
- Dark mode: class-based
- Custom color tokens using CSS variables
- Responsive container with center padding
- Custom animations for accordions
- Content paths: app/, components/, pages/, src/

### Next.js Configuration (next.config.js)
- React strict mode: enabled
- Image remote patterns: all HTTPS hosts allowed
- Ready for additional configuration (env variables, redirects, etc.)

### ESLint Configuration (.eslintrc.json)
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "react/no-unescaped-entities": "off"
  }
}
```

### Prettier Configuration (.prettierrc)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Environment Variables

### Available Variables (defined in lib/env.ts)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 24h)
- `REFRESH_TOKEN_SECRET` - Refresh token secret (min 32 chars)
- `REDIS_URL` - Redis connection string
- `NODE_ENV` - Environment (development/production/test)
- `NEXT_PUBLIC_APP_URL` - Public app URL

### Setup Instructions
1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. Environment is validated on startup using Zod schemas

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changes
npm run type-check       # Run TypeScript type checking
```

## Component Library Setup (shadcn/ui)

The project is configured for shadcn/ui but components must be added individually:

```bash
# Example: Add a button component
npx shadcn-ui@latest add button

# Example: Add a card component
npx shadcn-ui@latest add card

# Example: Add a dropdown menu
npx shadcn-ui@latest add dropdown-menu
```

Components will be installed to `/components/ui/` and can be imported as:
```tsx
import { Button } from '@/components/ui/button'
```

## Utility Functions

### Available in /lib/utils.ts

#### `cn(...inputs: ClassValue[])`
Merges Tailwind classes safely, removing conflicts.
```tsx
cn('px-2 py-1', 'px-3') // → 'py-1 px-3'
```

#### `formatCurrency(amount: number, currency?: string)`
Formats numbers as currency.
```tsx
formatCurrency(1234.56) // → '$1,234.56'
formatCurrency(1234.56, 'EUR') // → '€1,234.56'
```

#### `formatDate(date: Date | string)`
Formats date as human-readable string.
```tsx
formatDate(new Date()) // → 'September 30, 2025'
```

#### `formatDateTime(date: Date | string)`
Formats date and time.
```tsx
formatDateTime(new Date()) // → 'September 30, 2025, 2:30 PM'
```

#### `formatRelativeTime(date: Date | string)`
Formats relative time.
```tsx
formatRelativeTime(new Date(Date.now() - 3600000)) // → '1 hour ago'
```

#### `truncate(str: string, length: number)`
Truncates string to specified length.
```tsx
truncate('Hello World', 5) // → 'Hello...'
```

## Layout Components

### Sidebar (`components/layout/sidebar.tsx`)
- Responsive (collapses on mobile)
- Mobile hamburger menu
- Navigation items with icons
- Active state highlighting
- Version info in footer
- Overlay on mobile when open

### Header (`components/layout/header.tsx`)
- Notifications bell with badge
- User menu dropdown
- Settings and logout links
- Responsive design

### Footer (`components/layout/footer.tsx`)
- Copyright information
- Quick links (Privacy, Terms, Support)
- Responsive layout

### Breadcrumbs (`components/layout/breadcrumbs.tsx`)
- Auto-generated from URL path
- Home icon link
- Clickable intermediate segments
- Active page styling

## Protected Routes

### Usage
Wrap any page or component that requires authentication:

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function SecretPage() {
  return (
    <ProtectedRoute roles={['admin', 'dropshipper']}>
      <div>Protected content</div>
    </ProtectedRoute>
  )
}
```

### Features
- Automatic redirect to /login if not authenticated
- Role-based access control
- Loading state while checking auth
- Ready for integration with JWT/session logic

### Integration Required (Stream B)
The `ProtectedRoute` component has placeholder authentication logic that needs to be replaced with actual JWT validation:

```tsx
// TODO: Replace this in components/auth/protected-route.tsx
const isAuthenticated = false // await checkAuthStatus()
```

## Responsive Design

All components are mobile-first and responsive:
- **Mobile** (< 1024px): Sidebar hidden, hamburger menu
- **Desktop** (≥ 1024px): Sidebar visible, full layout

Breakpoints (Tailwind default):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Color Theme

### Light Mode Colors
- Primary: Blue (HSL 221.2, 83.2%, 53.3%)
- Background: White
- Foreground: Dark blue-gray
- Border: Light gray

### Dark Mode Colors
- Primary: Lighter blue
- Background: Dark blue-gray
- Foreground: Light gray
- Border: Dark gray

All colors use CSS variables (--primary, --background, etc.) and can be customized in `app/globals.css`.

### Dark Mode Toggle
Structure is ready but toggle UI needs to be implemented. Add a theme provider and toggle button:

```tsx
// Future implementation
<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Dark Mode
</button>
```

## Integration with Other Streams

### Stream A (Database Schema)
- No direct dependency
- Prisma will be used by API routes and server components
- Environment variable `DATABASE_URL` is configured

### Stream B (Authentication System)
- Protected route HOC is ready for integration
- Update `components/auth/protected-route.tsx` with actual auth checks
- Add logout handler to header user menu
- Add login form submission handler
- JWT secrets are configured in environment

### Stream D (CI/CD)
- Build command: `npm run build`
- Lint command: `npm run lint`
- Type check: `npm run type-check`
- All checks pass successfully

## Next Steps

1. **Add Authentication Logic** (Stream B)
   - Integrate JWT validation in protected route
   - Add login/logout API endpoints
   - Connect login form to API

2. **Install shadcn/ui Components**
   - Add components as needed (button, card, dialog, etc.)
   - Customize components in `/components/ui/`

3. **Build Feature Pages**
   - Products management
   - Orders management
   - Wallet management
   - Shopify integration
   - Analytics dashboard

4. **Set Up CI/CD** (Stream D)
   - GitHub Actions workflow
   - Vercel deployment
   - Environment variables in CI

## Common Issues & Solutions

### Issue: Module not found
**Solution**: Make sure to use path alias `@/` for imports:
```tsx
// ✓ Correct
import { cn } from '@/lib/utils'

// ✗ Wrong
import { cn } from '../lib/utils'
```

### Issue: Tailwind classes not working
**Solution**: Make sure file is included in `tailwind.config.js` content array and uses proper extensions (.tsx, .ts, .jsx, .js).

### Issue: Environment variable not found
**Solution**: Restart dev server after adding new env vars to `.env.local`.

### Issue: Build fails with type errors
**Solution**: Run `npm run type-check` to see detailed TypeScript errors.

## Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Make changes**
   - Components: `/components/`
   - Pages: `/app/`
   - Utilities: `/lib/`

3. **Format code**
   ```bash
   npm run format
   ```

4. **Check for errors**
   ```bash
   npm run lint
   npm run type-check
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "Issue #2: Description of changes"
   ```

## Support & Documentation

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Zod Docs**: https://zod.dev

## License & Credits

- CCPM Dropshipping Platform
- Built with Next.js 14+ App Router
- Styled with TailwindCSS and shadcn/ui
- 2025 - All rights reserved
