# Deployment Guide

This document provides comprehensive instructions for deploying the CCPM Dropshipping Platform to staging and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment to Staging](#deployment-to-staging)
- [Deployment to Production](#deployment-to-production)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables](#environment-variables)
- [Monitoring and Logs](#monitoring-and-logs)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

The CCPM Dropshipping Platform uses:
- **Hosting**: Vercel for Next.js deployment
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Database**: PostgreSQL (hosted separately - AWS RDS, Supabase, etc.)
- **Cache**: Redis (hosted separately - AWS ElastiCache, Upstash, etc.)

### Deployment Environments

- **Staging**: Automatically deployed on every push to `main` branch
- **Production**: Manually triggered or deployed on release tags (`v*`)

## Prerequisites

### Required Accounts
1. **Vercel Account**
   - Sign up at https://vercel.com
   - Create a new project linked to your GitHub repository

2. **GitHub Repository**
   - Repository must have Actions enabled
   - Required secrets configured (see below)

3. **Database & Redis**
   - PostgreSQL 15+ instance (AWS RDS, Supabase, Railway, etc.)
   - Redis instance (AWS ElastiCache, Upstash, Redis Cloud, etc.)

### GitHub Secrets Configuration

Navigate to your repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Vercel Secrets
- `VERCEL_TOKEN`: Your Vercel API token
  - Get from: https://vercel.com/account/tokens

- `VERCEL_ORG_ID`: Your Vercel organization ID
  - Get from: Project Settings → General → Organization ID

- `VERCEL_PROJECT_ID`: Your Vercel project ID
  - Get from: Project Settings → General → Project ID

#### Environment Variables (for both staging and production)

Add these as Environment Variables in Vercel dashboard:

**Database & Cache:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

**Authentication:**
- `JWT_SECRET`: Random string (minimum 32 characters)
- `JWT_EXPIRES_IN`: Token expiration (e.g., "24h")
- `REFRESH_TOKEN_SECRET`: Random string (minimum 32 characters)

**Application:**
- `NODE_ENV`: "production"
- `NEXT_PUBLIC_APP_URL`: Your application URL

**Optional (for future features):**
- `SHOPIFY_CLIENT_ID`: For Shopify integration
- `SHOPIFY_CLIENT_SECRET`: For Shopify OAuth
- `EMAIL_FROM`: SendGrid/SES sender email
- `EMAIL_API_KEY`: Email service API key

## Environment Setup

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd CCPM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local values
   ```

4. Start Docker services (PostgreSQL & Redis):
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npm run db:migrate
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Vercel Setup

1. **Install Vercel CLI** (optional, for manual deployments):
   ```bash
   npm install -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel login
   vercel link
   ```

3. **Add environment variables**:
   - Via CLI: `vercel env add <variable-name>`
   - Or via dashboard: Project Settings → Environment Variables

## Deployment to Staging

### Automatic Deployment

Staging deploys automatically when you push to the `main` branch:

```bash
git checkout main
git pull origin main
git merge your-feature-branch
git push origin main
```

The GitHub Actions workflow will:
1. Run tests (lint, type-check, build)
2. Deploy to Vercel staging environment
3. Post deployment URL in commit/PR

### Manual Deployment

To manually trigger a staging deployment:

1. **Via GitHub Actions**:
   - Go to Actions tab
   - Select "Deploy to Vercel" workflow
   - Click "Run workflow"
   - Select "staging" environment

2. **Via Vercel CLI**:
   ```bash
   vercel --token=$VERCEL_TOKEN
   ```

### Verify Staging Deployment

1. Check deployment URL from GitHub Actions output
2. Verify the build succeeded
3. Test critical functionality:
   - Login/authentication
   - Database connectivity
   - API endpoints
   - UI rendering

## Deployment to Production

### Production Deployment Process

Production deployments require explicit action to prevent accidental releases.

### Method 1: Release Tags (Recommended)

1. **Create a release tag**:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. The GitHub Actions workflow will automatically deploy to production

### Method 2: Manual Workflow Trigger

1. Go to GitHub Actions tab
2. Select "Deploy to Vercel" workflow
3. Click "Run workflow"
4. Select "production" environment
5. Confirm deployment

### Method 3: Vercel CLI

```bash
vercel --prod --token=$VERCEL_TOKEN
```

### Production Deployment Checklist

Before deploying to production:

- [ ] All tests passing in CI
- [ ] Staging deployment tested and verified
- [ ] Database migrations reviewed (if any)
- [ ] Breaking changes documented
- [ ] Team notified of deployment
- [ ] Backup of production database created
- [ ] Rollback plan ready

## CI/CD Pipeline

### Pipeline Overview

Our CI/CD pipeline consists of two workflows:

#### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers**: Pull requests and pushes to `main`

**Jobs**:
- **Lint**: Runs ESLint on all code
- **Type Check**: Validates TypeScript types
- **Build**: Builds Next.js application
- **Test**: Runs Jest test suite

All jobs run in parallel for speed.

#### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` → Staging
- Push tag `v*` → Production
- Manual trigger → Choose environment

**Jobs**:
- **Deploy to Staging**: Deploys preview build to Vercel
- **Deploy to Production**: Deploys production build to Vercel

### Build Process

The build process validates:
1. Code linting (ESLint)
2. Type checking (TypeScript)
3. Application build (Next.js)
4. Test execution (Jest)

**Build time**: ~3-5 minutes

**Cache**: npm dependencies are cached between runs

## Environment Variables

### Required Environment Variables

| Variable | Description | Example | Environment |
|----------|-------------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | All |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Random string | All |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | All |
| `REFRESH_TOKEN_SECRET` | Refresh token secret (32+ chars) | Random string | All |
| `REDIS_URL` | Redis connection string | `redis://host:6379` | All |
| `NODE_ENV` | Node environment | `production` | Prod only |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://app.example.com` | All |

### Optional Environment Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `SHOPIFY_CLIENT_ID` | Shopify app client ID | When Shopify integration is enabled |
| `SHOPIFY_CLIENT_SECRET` | Shopify OAuth secret | When Shopify integration is enabled |
| `EMAIL_FROM` | Email sender address | When email features are enabled |
| `EMAIL_API_KEY` | SendGrid/SES API key | When email features are enabled |
| `SENTRY_DSN` | Sentry error tracking | When error monitoring is configured |

### Setting Environment Variables in Vercel

**Via Dashboard**:
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope:
   - Production
   - Preview (Staging)
   - Development (optional)

**Via CLI**:
```bash
# For production
vercel env add DATABASE_URL production

# For preview (staging)
vercel env add DATABASE_URL preview

# For all environments
vercel env add JWT_SECRET
```

### Generating Secrets

Generate secure secrets using:

```bash
# Generate 32-character random string
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Monitoring and Logs

### Viewing Build Logs

**GitHub Actions**:
1. Go to Actions tab
2. Select the workflow run
3. Click on specific job to see logs

**Vercel Dashboard**:
1. Go to Deployments
2. Click on specific deployment
3. View build logs and runtime logs

### Application Logs

**Vercel Runtime Logs**:
1. Project → Logs
2. Filter by environment (Production/Preview)
3. Filter by time range

**Real-time Logs** (via CLI):
```bash
vercel logs <deployment-url> --follow
```

### Common Log Locations

- Build errors: GitHub Actions / Vercel build logs
- Runtime errors: Vercel runtime logs
- Database errors: Check DATABASE_URL connectivity
- Authentication errors: Check JWT_SECRET configuration

## Rollback Procedures

### Quick Rollback (Vercel Dashboard)

1. Go to Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm promotion

This instantly rolls back to the previous version.

### Rollback via Git Tag

If you need to redeploy a specific version:

```bash
# Find the tag you want to rollback to
git tag -l

# Create a new tag pointing to old commit
git tag -a v1.0.1-hotfix -m "Rollback to v1.0.0" v1.0.0

# Push the tag
git push origin v1.0.1-hotfix
```

The deployment workflow will deploy this version to production.

### Database Rollback

If database migrations were included:

1. **Restore from backup**:
   ```bash
   # For PostgreSQL
   pg_restore -d ccpm_dropshipping backup.dump
   ```

2. **Rollback migrations** (if using Prisma):
   ```bash
   npm run db:migrate -- resolve --rolled-back <migration-name>
   ```

### Rollback Checklist

- [ ] Identify the issue and last working version
- [ ] Check if database changes are involved
- [ ] Notify team about rollback
- [ ] Execute rollback
- [ ] Verify functionality restored
- [ ] Document incident and root cause
- [ ] Plan fix for next deployment

## Troubleshooting

### Build Failures

**Symptom**: CI pipeline fails during build

**Common Causes**:
- TypeScript errors
- ESLint errors
- Missing environment variables
- Dependency issues

**Solutions**:
```bash
# Run checks locally
npm run lint
npm run type-check
npm run build

# Update dependencies
npm install
```

### Deployment Failures

**Symptom**: Deployment fails in Vercel

**Common Causes**:
- Missing environment variables
- Build timeout
- Dependency conflicts

**Solutions**:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Check for dependency version conflicts
4. Try deploying from CLI for more detailed logs

### Runtime Errors

**Symptom**: Application crashes or returns 500 errors

**Common Causes**:
- Database connection issues
- Redis connection issues
- Invalid JWT secrets
- Missing environment variables

**Solutions**:
1. Check Vercel runtime logs
2. Verify DATABASE_URL and REDIS_URL
3. Test database connectivity
4. Check environment variable configuration

### Database Connection Issues

**Symptom**: "Cannot connect to database"

**Solutions**:
1. Verify DATABASE_URL format
2. Check database server is accessible
3. Verify credentials are correct
4. Check IP allowlist (if applicable)
5. Test connection using `psql` or database client

### Authentication Issues

**Symptom**: Login fails or tokens invalid

**Solutions**:
1. Verify JWT_SECRET is set correctly
2. Check JWT_EXPIRES_IN format
3. Verify REFRESH_TOKEN_SECRET is set
4. Clear browser cookies and try again

### Performance Issues

**Symptom**: Slow response times

**Solutions**:
1. Check database query performance
2. Verify Redis is connected
3. Review Vercel analytics
4. Check for N+1 queries
5. Consider adding database indexes

## Support and Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

### Internal Resources
- [Project Setup Guide](./PROJECT_SETUP.md)
- [Quick Start Guide](./QUICK_START.md)
- [Stream D Progress](./.claude/epics/dropshipping-platform/updates/2/stream-d.md)

### Getting Help
- Check GitHub Issues for known problems
- Review Vercel status page: https://www.vercel-status.com
- Contact team lead for production access

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
**Maintained by**: DevOps Team