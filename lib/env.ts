import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),

  // Authentication
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Shopify Integration
  SHOPIFY_CLIENT_ID: z.string().optional(),
  SHOPIFY_CLIENT_SECRET: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),

  // Email Service
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default('CCPM Dropshipping'),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables at build time
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    throw new Error('Invalid environment variables')
  }
}

// Export validated environment variables
export const env = validateEnv()
