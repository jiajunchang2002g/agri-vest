import { Link, useLocation } from "wouter";
import { Sprout, BarChart3, LayoutDashboard, PlusCircle, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Sprout className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight">Agrivest</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/campaigns" className={`transition-colors hover:text-primary ${location === "/campaigns" ? "text-primary" : "text-muted-foreground"}`}>
              Explore
            </Link>
            <Link href="/dashboard" className={`transition-colors hover:text-primary ${location === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>
              Dashboard
            </Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/campaigns/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Raise Funds
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-16 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            <span>© 2025 Agrivest XRPL</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Tractor className="h-3 w-3"/> Rooted in Trust</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3"/> Transparent Escrow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
