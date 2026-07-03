import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, LogOut, Settings, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsBell } from "@/components/NotificationsBell";

const baseLinks = [
  { label: "Home", path: "/" },
  { label: "Organizations", path: "/discover" },
  { label: "Funders", path: "/investors" },
  { label: "About", path: "/about" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  const isAdmin = roles.includes("admin");
  const isLoggedIn = !!user;
  const publicLinks = isLoggedIn ? baseLinks.filter((l) => l.path !== "/about") : baseLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Launch<span className="text-primary">Pad</span> Africa
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >{link.label}</Link>
          ))}
          {isLoggedIn && (
            <Link to="/dashboard" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/dashboard" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>Dashboard</Link>
          )}
          {isLoggedIn && roles.includes("ngo") && (
            <>
              <Link to="/proposals" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith("/proposals") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>Proposals</Link>
              <Link to="/funding-intelligence" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith("/funding-intelligence") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>Funding AI</Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/admin" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>Admin</Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!loading && isLoggedIn ? (
            <>
              <NotificationsBell />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings" className="gap-2"><Settings className="h-4 w-4" /> Settings</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : !loading ? (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
              <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
            </>
          ) : null}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {publicLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">{link.label}</Link>
            ))}
            {isLoggedIn && (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</Link>
                {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted flex items-center gap-2"><Shield className="h-4 w-4" /> Admin</Link>}
              </>
            )}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
              {isLoggedIn ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>Sign out</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link></Button>
                  <Button size="sm" className="flex-1" asChild><Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link></Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
