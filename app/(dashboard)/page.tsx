import { 
  Package, 
  ShoppingCart, 
  Wallet, 
  TrendingUp 
} from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      name: 'Total Products',
      value: '0',
      icon: Package,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Active Orders',
      value: '0',
      icon: ShoppingCart,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Wallet Balance',
      value: '$0.00',
      icon: Wallet,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Revenue',
      value: '$0.00',
      icon: TrendingUp,
      change: '+0%',
      changeType: 'positive',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to your dropshipping platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span
                className={
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {stat.change}
              </span>
              <span className="ml-2 text-muted-foreground">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-medium">Add Product</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a new product to your catalog
            </p>
          </button>
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-medium">View Orders</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your recent orders
            </p>
          </button>
          <button className="rounded-lg border p-4 text-left hover:bg-accent">
            <h3 className="font-medium">Connect Store</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Link your Shopify store
            </p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="mt-4 text-center text-muted-foreground">
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  )
}
