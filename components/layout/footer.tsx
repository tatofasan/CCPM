export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-between space-y-2 text-sm text-muted-foreground sm:flex-row sm:space-y-0">
          <div>
            <p>2025 CCPM Dropshipping Platform. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
