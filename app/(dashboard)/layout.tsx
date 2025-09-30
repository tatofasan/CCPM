import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="mb-6">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
