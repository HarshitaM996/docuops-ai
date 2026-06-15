"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenants } from "@/context/tenant-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, FolderOpen, Bot, Settings, Bell, ChevronDown, LogOut, Menu, ShieldCheck, HelpCircle } from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon: Icon, label, active }) => (
  <Link
    href={href}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
    }`}
  >
    <Icon className={`h-4.5 w-4.5 ${active ? "text-indigo-400" : "text-zinc-500"}`} />
    <span>{label}</span>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenants, activeTenant, setActiveTenant } = useTenants();
  
  const [showNotifications, setShowNotifications] = useState(false);

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/documents", icon: FolderOpen, label: "Document Workspace" },
    { href: "/dashboard/assistant", icon: Bot, label: "AI Compliance Assistant" },
  ];

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-50 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-900 bg-zinc-950/80 backdrop-blur-xl p-5 space-y-6 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight">DocuOps AI</span>
            <span className="block text-[10px] text-zinc-500 font-medium tracking-widest uppercase">v1.2.0</span>
          </div>
        </div>

        {/* Tenant Selector */}
        <div className="space-y-1.5 px-2 pt-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Workspace Tenant
          </label>
          <Select value={activeTenant.id} onValueChange={(val) => val && setActiveTenant(val)}>
            <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-200 text-xs focus:ring-0">
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs focus:bg-zinc-800 focus:text-white">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <hr className="border-zinc-900" />

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              active={pathname === link.href}
            />
          ))}
        </nav>

        {/* Footer / User controls */}
        <div className="space-y-4 pt-4 border-t border-zinc-900">
          <Link
            href="#"
            className="flex items-center space-x-3 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Documentation & Support</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center justify-between w-full p-2 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-850 transition-all text-left" />
              }
            >
              <div className="flex items-center space-x-2.5">
                <Avatar className="h-8 w-8 border border-zinc-800">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-zinc-800 text-indigo-400 text-xs font-bold">HM</AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <span className="block text-xs font-semibold text-zinc-200 leading-tight">Harshita M</span>
                  <span className="text-[10px] text-zinc-500">Legal Counsel</span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-zinc-900 border-zinc-800 text-zinc-300" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white text-xs cursor-pointer">
                <Settings className="h-3.5 w-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="focus:bg-zinc-800 focus:text-red-400 text-xs cursor-pointer text-red-500"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - Mobile and Desktop */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-xl px-6 flex items-center justify-between z-20 shrink-0">
          {/* Left section: mobile toggle and page title */}
          <div className="flex items-center space-x-4">
            {/* Mobile Sheet Trigger */}
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-zinc-200" />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-zinc-950 border-r border-zinc-900 p-5 w-64 text-zinc-50 flex flex-col">
                <div className="flex items-center space-x-2.5 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-white text-lg tracking-tight">DocuOps AI</span>
                </div>

                <div className="space-y-1 mb-6">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Active Tenant
                  </label>
                  <Select value={activeTenant.id} onValueChange={(val) => val && setActiveTenant(val)}>
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <nav className="flex-1 space-y-1">
                  {links.map((link) => (
                    <SidebarLink
                      key={link.href}
                      href={link.href}
                      icon={link.icon}
                      label={link.label}
                      active={pathname === link.href}
                    />
                  ))}
                </nav>

                <div className="pt-4 border-t border-zinc-900 space-y-4">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <span className="text-sm font-semibold text-zinc-400 hidden md:inline-block">
              Workspace / {activeTenant.name}
            </span>
          </div>

          {/* Right section: Actions and profile */}
          <div className="flex items-center space-x-4">
            {/* Alerts Center Dropdown */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full hover:bg-zinc-900 border border-zinc-850 h-9 w-9 text-zinc-400 hover:text-zinc-200"
                  />
                }
              >
                <Bell className="h-4 w-4" />
                {activeTenant.alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-zinc-950 animate-pulse">
                    {activeTenant.alerts.length}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-zinc-900 border-zinc-800 text-zinc-350 p-0" align="end">
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Compliance Alerts</span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-full font-semibold">
                    {activeTenant.alerts.length} active
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {activeTenant.alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      No active alerts for this tenant.
                    </div>
                  ) : (
                    activeTenant.alerts.map((alert) => (
                      <div key={alert.id} className="p-3 border-b border-zinc-850 last:border-0 hover:bg-zinc-800/30 transition-colors flex gap-2.5">
                        <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          alert.severity === "high" ? "bg-rose-500" : alert.severity === "medium" ? "bg-amber-500" : "bg-zinc-400"
                        }`} />
                        <div className="space-y-0.5 min-w-0">
                          <span className="block text-[11px] font-bold text-zinc-300 leading-normal truncate">
                            {alert.documentName}
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-normal">
                            {alert.message}
                          </p>
                          <span className="text-[9px] text-zinc-500 block pt-0.5">{alert.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {activeTenant.alerts.length > 0 && (
                  <div className="p-2 border-t border-zinc-800 text-center">
                    <Link href="/dashboard" onClick={() => setShowNotifications(false)} className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300">
                      View all system alerts
                    </Link>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile trigger (Mobile) */}
            <div className="md:hidden">
              <Avatar className="h-8 w-8 border border-zinc-800" onClick={handleLogout}>
                <AvatarFallback className="bg-zinc-800 text-indigo-400 text-xs font-bold">HM</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
