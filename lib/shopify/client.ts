import { env } from '@/lib/env'

export interface ShopifyOrder {
  id: number
  name: string
  email: string
  created_at: string
  total_price: string
  currency: string
  financial_status: string
  fulfillment_status: string | null
  customer: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  shipping_address: {
    first_name: string
    last_name: string
    address1: string
    address2: string | null
    city: string
    province: string
    country: string
    zip: string
    phone: string
  }
  line_items: Array<{
    id: number
    product_id: number
    variant_id: number
    title: string
    quantity: number
    price: string
    sku: string
  }>
  payment_gateway_names: string[]
  total_shipping_price_set: {
    shop_money: {
      amount: string
      currency_code: string
    }
  }
}

export interface ShopifyShop {
  id: number
  name: string
  email: string
  domain: string
  currency: string
  timezone: string
}

export interface ShopifyWebhook {
  id: number
  address: string
  topic: string
  created_at: string
  updated_at: string
  format: string
}

export interface ShopifyRateLimitInfo {
  remaining: number
  maximum: number
  restoreRate: number
}

export class ShopifyAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
  ) {
    super(message)
    this.name = 'ShopifyAPIError'
  }
}

export class ShopifyRateLimitError extends ShopifyAPIError {
  constructor(
    message: string,
    public retryAfter: number,
  ) {
    super(message, 429)
    this.name = 'ShopifyRateLimitError'
  }
}

export class ShopifyClient {
  private shopDomain: string
  private accessToken: string
  private apiVersion: string = '2024-01'

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain
    this.accessToken = accessToken
  }

  private getBaseUrl(): string {
    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`

    const headers = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Extract rate limit information from headers
      const rateLimitInfo = this.extractRateLimitInfo(response.headers)

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get('Retry-After') || '2',
          10,
        )
        throw new ShopifyRateLimitError(
          'Shopify API rate limit exceeded',
          retryAfter,
        )
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ShopifyAPIError(
          errorData.errors || `Shopify API error: ${response.statusText}`,
          response.status,
          errorData,
        )
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error instanceof ShopifyAPIError) {
        throw error
      }
      throw new ShopifyAPIError(
        `Failed to make request to Shopify: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private extractRateLimitInfo(headers: Headers): ShopifyRateLimitInfo | null {
    const limitHeader = headers.get('X-Shopify-Shop-Api-Call-Limit')
    if (!limitHeader) return null

    const [current, maximum] = limitHeader.split('/').map(Number)
    return {
      remaining: maximum - current,
      maximum,
      restoreRate: 2, // Shopify restores 2 requests per second
    }
  }

  /**
   * Get shop information
   */
  async getShop(): Promise<ShopifyShop> {
    const response = await this.makeRequest<{ shop: ShopifyShop }>('/shop.json')
    return response.shop
  }

  /**
   * Get orders with optional filters
   */
  async getOrders(params?: {
    limit?: number
    since_id?: number
    created_at_min?: string
    created_at_max?: string
    status?: string
  }): Promise<ShopifyOrder[]> {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const queryString = queryParams.toString()
    const endpoint = `/orders.json${queryString ? `?${queryString}` : ''}`

    const response = await this.makeRequest<{ orders: ShopifyOrder[] }>(
      endpoint,
    )
    return response.orders
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string): Promise<ShopifyOrder> {
    const response = await this.makeRequest<{ order: ShopifyOrder }>(
      `/orders/${orderId}.json`,
    )
    return response.order
  }

  /**
   * Register a webhook subscription
   */
  async registerWebhook(topic: string, address: string): Promise<ShopifyWebhook> {
    const response = await this.makeRequest<{ webhook: ShopifyWebhook }>(
      '/webhooks.json',
      {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format: 'json',
          },
        }),
      },
    )
    return response.webhook
  }

  /**
   * Get all registered webhooks
   */
  async getWebhooks(): Promise<ShopifyWebhook[]> {
    const response = await this.makeRequest<{ webhooks: ShopifyWebhook[] }>(
      '/webhooks.json',
    )
    return response.webhooks
  }

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.makeRequest(`/webhooks/${webhookId}.json`, {
      method: 'DELETE',
    })
  }

  /**
   * Verify shop domain format
   */
  static isValidShopDomain(domain: string): boolean {
    // Check if domain ends with .myshopify.com
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
    return shopifyDomainRegex.test(domain)
  }

  /**
   * Normalize shop domain (add .myshopify.com if missing)
   */
  static normalizeShopDomain(domain: string): string {
    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '')

    // Remove trailing slash
    domain = domain.replace(/\/$/, '')

    // Add .myshopify.com if not present
    if (!domain.endsWith('.myshopify.com')) {
      domain = `${domain}.myshopify.com`
    }

    return domain
  }
}