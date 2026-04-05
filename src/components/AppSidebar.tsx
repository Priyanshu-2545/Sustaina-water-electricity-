import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Clock,
  Bell,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/reminders", icon: Clock, label: "Schedule Reminder" },
  { to: "/dashboard/notifications", icon: Bell, label: "Notifications" },
  { to: "/dashboard/reports", icon: FileText, label: "Reports" },
  { to: "/dashboard/support", icon: HelpCircle, label: "Support" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground shadow-xl">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-6 py-6 border-b border-border",
          collapsed && "justify-center px-2"
        )}
      >
        <Droplets className="h-7 w-7 text-accent shrink-0" />
        {!collapsed && (
          <span className="text-xl font-bold font-display tracking-wide">
            SUSTAINA
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/dashboard"}
            onClick={() => setMobileOpen(false)}
            title={l.label}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                collapsed && "justify-center px-2"
              )
            }
          >
            <l.icon className="h-5 w-5 shrink-0" />
            {!collapsed && l.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-2 border-t border-border pt-3">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted w-full",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && "Logout"}
        </button>

        {/* Collapse (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center px-3 py-2 rounded-lg hover:bg-muted w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 🔥 FIXED HAMBURGER (TOP LEFT PERFECT) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[100] rounded-xl bg-primary/90 backdrop-blur-md p-2 text-primary-foreground md:hidden shadow-lg"
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out",
          "bg-sidebar",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-[75%] max-w-[280px]", // mobile width
          "md:relative md:translate-x-0 md:w-64",
          collapsed && "md:w-16"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AppSidebar;