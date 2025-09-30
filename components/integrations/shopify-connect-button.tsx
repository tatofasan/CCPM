'use client'

import { useState } from 'react'
import { ShopifyStatus } from '@prisma/client'

export interface ShopifyConnection {
  id: string
  shopDomain: string
  status: ShopifyStatus
  lastSyncAt: Date | null
  createdAt: Date
}

interface ShopifyConnectButtonProps {
  connection?: ShopifyConnection
  onConnect?: () => void
  onDisconnect?: () => void
}

export default function ShopifyConnectButton({
  connection,
  onConnect,
  onDisconnect,
}: ShopifyConnectButtonProps) {
  const [shopDomain, setShopDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the connect API to get the authorization URL
      const response = await fetch(
        `/api/integrations/shopify/connect?shop=${encodeURIComponent(shopDomain)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to initiate connection')
      }

      const data = await response.json()

      // Redirect to Shopify OAuth page
      window.location.href = data.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!connection) return

    if (
      !confirm(
        `Are you sure you want to disconnect ${connection.shopDomain}? This will stop syncing orders from this store.`,
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations/shopify/disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          shopDomain: connection.shopDomain,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to disconnect')
      }

      if (onDisconnect) {
        onDisconnect()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  if (connection) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {connection.shopDomain}
                </h3>
                <p className="text-sm text-gray-500">
                  Connected on{' '}
                  {new Date(connection.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    connection.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : connection.status === 'ERROR'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {connection.status}
                </span>
              </div>
              {connection.lastSyncAt && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Last sync:</span>
                  <span className="text-gray-600">
                    {new Date(connection.lastSyncAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="ml-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15.337 2.163c-.045-.057-.113-.074-.156-.084-.023-.006-.095-.023-.189.008-.03.01-.23.085-.41.156l-.01.004c-.18.07-.35.137-.472.182-.123.046-.27.1-.416.158-.146.058-.288.118-.409.167-.12.05-.212.086-.253.105l-.028.013c-.016.008-.028.013-.035.017-.007.004-.013.007-.017.01-.004.002-.007.004-.009.006-.003.002-.004.003-.005.004l-.001.001v.001l-1.45.567-.09.036c-.03.011-.059.023-.089.034-.03.011-.058.022-.086.033-.028.01-.055.021-.082.031-.027.01-.053.02-.078.029-.025.01-.049.019-.072.028-.023.009-.045.018-.066.027-.021.008-.041.016-.06.024l-.056.022c-.018.007-.036.015-.052.021-.017.007-.032.013-.047.019-.015.006-.029.012-.043.018-.013.005-.026.011-.038.016-.012.005-.023.01-.033.014-.01.004-.019.009-.028.013-.009.003-.017.007-.024.01-.008.004-.014.007-.02.009-.006.003-.011.006-.016.008l-.011.006-.006.002-.002.001h-.001l-.001.001-1.616.666v.001l-.001.001-.002.001-.006.002-.011.005c-.007.003-.015.007-.024.011-.009.004-.018.008-.028.013-.01.004-.021.009-.033.014-.012.005-.025.01-.038.016-.014.006-.028.012-.043.018-.015.006-.03.012-.047.019-.017.007-.034.014-.052.022l-.056.022c-.019.008-.039.016-.06.024-.021.009-.043.017-.066.026-.023.01-.047.019-.072.028-.025.01-.051.019-.078.029-.027.01-.054.02-.082.031-.028.011-.057.022-.086.033-.03.011-.059.023-.089.034l-.09.036-1.45.567-.001-.001-.001-.001c-.001-.001-.002-.002-.005-.004-.002-.002-.005-.004-.009-.006-.004-.003-.01-.006-.017-.01-.007-.004-.019-.009-.035-.017l-.028-.013c-.041-.019-.133-.055-.253-.105-.121-.05-.263-.109-.409-.167-.146-.058-.293-.112-.416-.158-.122-.045-.292-.112-.472-.182l-.01-.004c-.18-.071-.38-.146-.41-.156-.094-.031-.166-.014-.189-.008-.043.01-.111.027-.156.084C3.015 2.2 3 2.272 3 2.333v.001c0 .062.015.134.038.206.023.072.057.147.095.22.037.072.078.14.114.196.036.055.065.095.08.117l.01.015c.006.008.01.014.013.018l.009.012.007.009c.003.004.005.007.006.008l.002.003.001.001v.001l.887 1.21.056.076c.019.026.037.052.056.078.019.025.037.051.056.076.018.025.036.05.054.074.018.024.035.048.052.071.017.023.033.046.049.068.016.022.031.044.046.065.015.021.029.041.043.061l.04.057c.013.019.025.037.037.055.012.017.023.034.034.051.011.016.021.032.031.047.01.015.019.03.028.044.009.014.017.028.025.041.008.013.015.026.022.038.007.012.013.024.019.035.006.011.011.022.016.032.005.01.01.02.014.029.005.009.008.018.012.026.004.008.007.016.01.023.003.007.006.014.008.02.002.006.004.012.006.017l.003.011.001.006v.002l.387 1.617v.001l.001.001.001.002.003.006.005.011c.003.007.007.015.011.024.004.009.008.018.013.028.004.01.009.021.014.033.005.012.01.025.016.038.006.014.012.028.018.043.006.015.013.03.02.047.006.016.014.033.021.051l.023.056c.008.019.016.039.024.06.009.021.017.043.027.066.009.023.019.047.028.072.01.025.019.051.029.078.01.027.02.054.031.082.011.028.022.057.033.086.011.03.023.059.034.089l.036.09.567 1.45-.001.001-.001.001c-.001.001-.002.002-.004.005-.002.002-.004.005-.006.009-.003.004-.006.01-.01.017-.004.007-.009.019-.017.035l-.013.028c-.019.041-.055.133-.105.253-.05.121-.109.263-.167.409-.058.146-.112.293-.158.416-.045.122-.112.292-.182.472l-.004.01c-.071.18-.146.38-.156.41-.031.094-.014.166-.008.189.01.043.027.111.084.156.037.029.076.044.112.052.036.008.071.01.102.01.031 0 .06-.002.086-.006.026-.003.049-.007.069-.01.02-.004.037-.007.051-.009l.021-.004c.008-.001.014-.003.019-.004l.013-.002.009-.002.008-.001h.003l.001-.001.001-.001 1.617-.387.011-.003.006-.001.002-.001h.001l.001-.001c.006-.002.011-.004.017-.006.006-.002.013-.005.02-.008.007-.003.015-.006.023-.01.008-.004.017-.007.026-.012.009-.004.019-.009.029-.014.01-.005.021-.01.032-.016.011-.005.023-.011.035-.019.012-.007.025-.014.038-.022.013-.008.027-.016.041-.025.014-.009.029-.018.044-.028.015-.01.031-.02.047-.031.017-.011.034-.023.051-.034.018-.012.037-.024.055-.037l.057-.04c.02-.014.04-.028.061-.043.021-.015.043-.031.065-.046.022-.016.045-.032.068-.049.023-.017.047-.034.071-.052.024-.018.049-.036.074-.054.025-.019.051-.037.076-.056.026-.019.052-.038.078-.056l.076-.056 1.21-.887.001-.001.001-.001.003-.002c.001-.001.004-.003.008-.006l.009-.007.012-.009c.004-.003.01-.007.018-.013l.015-.01c.022-.015.062-.044.117-.08.056-.036.124-.077.196-.114.073-.038.148-.072.22-.095.072-.023.144-.038.206-.038h.001c.061 0 .133.015.205.038.072.023.147.057.22.095.072.037.14.078.196.114.055.036.095.065.117.08l.015.01c.008.006.014.01.018.013l.012.009.009.007c.004.003.007.005.008.006l.003.002.001.001.001.001 1.21.887.076.056c.026.018.052.037.078.056.025.019.051.037.076.056.024.018.049.036.074.054.024.018.048.035.071.052.023.017.046.033.068.049.022.015.044.031.065.046.021.015.041.029.061.043l.057.04c.019.013.038.025.055.037.017.011.034.022.051.034.016.011.032.021.047.031.015.01.03.019.044.028.014.009.028.017.041.025.013.008.026.015.038.022.012.007.024.013.035.019.011.005.022.011.032.016.01.005.02.01.029.014.009.004.018.008.026.012.008.004.016.007.023.01.007.003.014.006.02.008.006.002.011.004.017.006l.001.001h.001l.002.001.006.001.011.003 1.617.387.001.001h.003l.008.001.009.002.013.002c.005.001.011.003.019.004l.021.004c.014.002.031.005.051.009.02.003.043.007.069.01.026.004.055.006.086.006.031 0 .066-.002.102-.01.036-.008.075-.023.112-.052.057-.045.074-.113.084-.156.006-.023.023-.095-.008-.189-.01-.03-.085-.23-.156-.41l-.004-.01c-.07-.18-.137-.35-.182-.472-.046-.123-.1-.27-.158-.416-.058-.146-.118-.288-.167-.409-.05-.12-.086-.212-.105-.253l-.013-.028c-.008-.016-.013-.028-.017-.035-.004-.007-.007-.013-.01-.017-.003-.004-.004-.007-.006-.009-.002-.003-.003-.004-.004-.005l-.001-.001-.001-.001.567-1.45.036-.09c.011-.03.023-.059.034-.089.011-.029.022-.058.033-.086.01-.028.02-.054.031-.082.01-.027.019-.053.029-.078.009-.025.019-.049.028-.072.01-.023.018-.045.027-.066.008-.021.016-.041.024-.06l.023-.056c.007-.018.015-.035.021-.051.007-.017.014-.032.02-.047.006-.015.012-.029.018-.043.006-.013.011-.026.016-.038.005-.012.01-.023.014-.033.005-.01.009-.019.013-.028.004-.009.008-.017.011-.024l.005-.011.003-.006.001-.002.001-.001v-.001l.387-1.617v-.002l.001-.006.003-.011c.002-.005.004-.011.006-.017.002-.006.005-.013.008-.02.003-.007.006-.015.01-.023.004-.008.007-.017.012-.026.004-.009.009-.019.014-.029.005-.01.01-.021.016-.032.006-.011.012-.023.019-.035.007-.012.014-.025.022-.038.008-.013.016-.027.025-.041.009-.014.018-.029.028-.044.01-.015.02-.031.031-.047.011-.017.022-.034.034-.051.012-.018.024-.036.037-.055l.04-.057c.014-.02.028-.04.043-.061.015-.021.03-.043.046-.065.016-.022.032-.045.049-.068.017-.023.034-.047.052-.071.018-.024.036-.049.054-.074.019-.025.037-.051.056-.076.019-.026.037-.052.056-.078l.056-.076.887-1.21v-.001l.001-.001.002-.003c.001-.001.003-.004.006-.008l.007-.009.009-.012c.003-.004.007-.01.013-.018l.01-.015c.015-.022.044-.062.08-.117.036-.056.077-.124.114-.196.038-.073.072-.148.095-.22.023-.072.038-.144.038-.206v-.001c0-.061-.015-.133-.038-.205z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Connect Shopify Store
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Shopify store to automatically sync orders and manage
            your dropshipping business
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="shopDomain"
                className="block text-sm font-medium text-gray-700"
              >
                Shop Domain
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="shopDomain"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  placeholder="mystore.myshopify.com"
                  className="block w-full rounded-md border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter your shop domain (e.g., mystore.myshopify.com or just
                mystore)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading || !shopDomain.trim()}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Shopify Store'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}