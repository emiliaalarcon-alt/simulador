import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Upload, Settings, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { clearToken, getToken } from "@/lib/auth";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/carreras", icon: BookOpen, label: "Carreras" },
  { href: "/admin/upload", icon: Upload, label: "Subir PDF" },
  { href: "/admin/settings", icon: Settings, label: "Ajustes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!getToken()) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    clearToken();
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex flex-col fixed h-full z-40">
        <div className="p-4 border-b border-sidebar-border">
          <Logo size="sm" variant="white" />
          <p className="text-[10px] text-sidebar-foreground/60 mt-1.5 ml-10 uppercase tracking-widest font-semibold">Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
