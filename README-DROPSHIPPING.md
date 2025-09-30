# CCPM Dropshipping Platform

[![CI Pipeline](https://github.com/tatofasan/CCPM/actions/workflows/ci.yml/badge.svg)](https://github.com/tatofasan/CCPM/actions/workflows/ci.yml)
[![Deploy to Vercel](https://github.com/tatofasan/CCPM/actions/workflows/deploy.yml/badge.svg)](https://github.com/tatofasan/CCPM/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive dropshipping platform built with Next.js 14, featuring multi-vendor support, order management, wallet system, and Shopify integration.

## Features

- **User Management**: Role-based access control (Admin, Dropshipper)
- **Product Management**: Full product lifecycle with supplier integration
- **Order Processing**: Complete order workflow with event sourcing
- **Wallet System**: Built-in wallet with double-entry bookkeeping
- **Shopify Integration**: Seamless connection with Shopify stores
- **Multi-Warehouse**: Support for multiple warehouses and suppliers

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local development)
- PostgreSQL 15+ (production)
- Redis (production)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CCPM
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start Docker services**:
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

6. **Seed the database** (optional):
   ```bash
   npm run db:seed
   ```

7. **Start the development server**:
   ```bash
   npm run dev
   ```

8. **Open the application**:
   - Visit http://localhost:3000
   - Default admin credentials will be shown after seeding

### Docker Services

The `docker-compose.yml` includes:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- Adminer (port 8080) - database management UI

Access Adminer at http://localhost:8080

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `npm run test` | Run tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database |

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utility functions
│   ├── auth/               # Authentication utilities
│   └── db/                 # Database utilities
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Migration files
├── .github/workflows/       # CI/CD pipelines
└── public/                  # Static assets
```

## CI/CD Pipeline

### Continuous Integration

The CI pipeline runs on every pull request and push to `main`:

- **Lint**: ESLint checks
- **Type Check**: TypeScript validation
- **Build**: Next.js build verification
- **Test**: Jest test suite

Pipeline status: [![CI](https://github.com/tatofasan/CCPM/actions/workflows/ci.yml/badge.svg)](https://github.com/tatofasan/CCPM/actions/workflows/ci.yml)

### Continuous Deployment

Automatic deployments:
- **Staging**: Every push to `main` branch
- **Production**: Manual trigger or release tags (`v*`)

Deployment status: [![Deploy](https://github.com/tatofasan/CCPM/actions/workflows/deploy.yml/badge.svg)](https://github.com/tatofasan/CCPM/actions/workflows/deploy.yml)

### Deployment Workflow

```bash
# Deploy to staging (automatic)
git push origin main

# Deploy to production (create release)
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Manual deployment via GitHub Actions
# Go to Actions → Deploy to Vercel → Run workflow
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Environment Variables

### Required Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-minimum-32-characters
REDIS_URL=redis://host:6379
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

```env
SHOPIFY_CLIENT_ID=your-shopify-client-id
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret
EMAIL_FROM=noreply@example.com
EMAIL_API_KEY=your-email-service-api-key
```

See [.env.example](./.env.example) for complete list.

## Database Schema

The platform uses 13 core entities:

- **users** - User accounts with authentication
- **dropshipper_profiles** - Extended dropshipper information
- **products** - Product catalog
- **suppliers** - Supplier management
- **warehouses** - Warehouse locations
- **orders** - Order records
- **order_items** - Order line items
- **order_events** - Event sourcing for orders
- **wallet_transactions** - Financial transactions
- **deposit_requests** - Wallet deposit requests
- **withdrawal_requests** - Wallet withdrawal requests
- **bank_accounts** - User bank account information
- **shopify_connections** - Shopify store integrations

View schema: [prisma/schema.prisma](./prisma/schema.prisma)

## Authentication & Authorization

### Authentication Flow

1. **Login**: POST `/api/auth/login`
   - Returns access token (24h) and refresh token (7d)
2. **Refresh**: POST `/api/auth/refresh`
   - Returns new access token
3. **Logout**: POST `/api/auth/logout`
   - Invalidates session

### Role-Based Access Control (RBAC)

**Roles**:
- `admin`: Full system access
- `dropshipper`: Limited to own data
- `dropshipper_basic`: Limited dropshipper features
- `dropshipper_premium`: Full dropshipper features

**Permissions**: Defined in `/lib/auth/rbac.ts`

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
__tests__/
├── api/              # API endpoint tests
├── components/       # Component tests
├── lib/              # Utility function tests
└── integration/      # Integration tests
```

**Note**: Test suite is currently in setup phase. Placeholder tests are included.

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

- **Configuration**: [vercel.json](./vercel.json)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 20.x

### Environment Setup

1. **Create Vercel Project**:
   - Link to GitHub repository
   - Configure build settings

2. **Add Environment Variables**:
   - Set all required variables in Vercel dashboard
   - Separate environments for staging and production

3. **Configure GitHub Secrets**:
   - `VERCEL_TOKEN`: Vercel API token
   - `VERCEL_ORG_ID`: Organization ID
   - `VERCEL_PROJECT_ID`: Project ID

### Deployment Checklist

Before deploying:
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis instance available
- [ ] Domain configured (if using custom domain)

See detailed instructions: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Monitoring & Logging

### Build Logs
- GitHub Actions: Repository → Actions tab
- Vercel: Project → Deployments

### Runtime Logs
- Vercel Dashboard: Project → Logs
- CLI: `vercel logs <deployment-url>`

### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for performance monitoring

## Contributing

### Branching Strategy

- `main`: Production-ready code
- `epic/*`: Epic feature branches
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

### Commit Format

```
Issue #<number>: <description>

Example:
Issue #2: Add CI/CD pipeline configuration
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request review from team
6. Merge after approval

## Documentation

- **Setup Guide**: [PROJECT_SETUP.md](./PROJECT_SETUP.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: Coming soon
- **Architecture**: Coming soon

## Roadmap

### Phase 1: Foundation (In Progress)
- [x] Project setup
- [x] Database schema
- [x] Authentication system
- [x] CI/CD pipeline
- [ ] Basic UI components

### Phase 2: Core Features
- [ ] Product management
- [ ] Order processing
- [ ] Wallet system
- [ ] User dashboard

### Phase 3: Integrations
- [ ] Shopify integration
- [ ] Payment gateways
- [ ] Email notifications
- [ ] Analytics

### Phase 4: Advanced Features
- [ ] Multi-warehouse routing
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] API for third-party integrations

## Support

### Getting Help
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review [PROJECT_SETUP.md](./PROJECT_SETUP.md) for setup questions
- Open GitHub issue for bugs or feature requests

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**Project Status**: In Development (Issue #2 - Foundation & Infrastructure)

**Last Updated**: 2025-09-30