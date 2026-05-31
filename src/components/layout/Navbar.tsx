"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Search,
  Sparkles,
  NotebookPen,
  Bell,
  Video,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { useDashboardAlerts } from "@/hooks/use-dashboard-alerts";
import { useIsMobile } from "@/hooks/use-mobile";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { CommandSearch } from "./CommandSearch";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: alerts } = useDashboardAlerts();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  const hasAlerts = alerts && alerts.length > 0 && !hasViewedNotifications;
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigation = [
    { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
    { name: "Agenda", href: "/agenda", icon: Calendar },
    { name: "Teleconsulta", href: "/teleconsulta", icon: Video },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Notas", href: "/notas", icon: NotebookPen },
    { name: "NeuroFinance", href: "/financeiro", icon: DollarSign },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) toast.success("Até logo.");
    navigate("/auth");
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Usuário';

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

    if (item.name === "NeuroFinance") {
      const isFinanceActive = location.pathname.startsWith("/financeiro");

      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            <Link to={item.href} id={`nav-${item.href.replace('/', '')}`}>
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-[14px] transition-all duration-500 cursor-pointer group",
                  isFinanceActive
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-xl"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform duration-500", isFinanceActive ? "scale-100" : "group-hover:scale-110")} />
                {isFinanceActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-white/95 dark:bg-[#0A0A0C]/95 border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase px-4 py-2 rounded-xl text-zinc-500 tracking-[0.2em] backdrop-blur-xl">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip key={item.name}>
        <TooltipTrigger asChild>
          <Link to={item.href} id={`nav-${item.href.replace('/', '')}`}>
            <div
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-[14px] transition-all duration-500 cursor-pointer group",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-xl"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-500", isActive ? "scale-100" : "group-hover:scale-110")} />

              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white/95 dark:bg-[#0A0A0C]/95 border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase px-4 py-2 rounded-xl text-zinc-500 tracking-[0.2em] backdrop-blur-xl">
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  };

  if (isMobile) return null;

  return (
    <nav id="navbar-container" className="fixed top-8 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto bg-white/70 dark:bg-[#050505]/70 backdrop-blur-[48px] border border-white/20 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] px-6 py-2.5 rounded-full flex items-center gap-6 transition-all duration-700 ease-apple hover:border-white/40 dark:hover:border-white/20 hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.4)] ring-1 ring-black/5 dark:ring-white/5 active:scale-[0.99]" >

        {/* Logo Area */}
        <div className="flex items-center pr-6 border-r border-black/[0.04] dark:border-white/[0.08]">
          <Link
            to="/synapse-ai"
            className="relative flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-500 group mr-4"
          >
            <div className="absolute inset-0 rounded-2xl bg-zinc-900 dark:bg-white shadow-xl transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
          </Link>

          <span className="text-[10px] font-black text-zinc-900 dark:text-white tracking-[0.3em] uppercase hidden md:block transition-colors duration-500">
            NeuroNex
          </span>
        </div>

        {/* Navigation Items */}
        <div id="main-navigation" className="flex items-center gap-1.5">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1 pl-6 border-l border-black/[0.04] dark:border-white/[0.08]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="global-search"
                size="icon"
                variant="ghost"
                className="w-10 h-10 rounded-[14px] hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all duration-500"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-white/95 dark:bg-[#0A0A0C]/95 border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase px-4 py-2 rounded-xl text-zinc-500 tracking-[0.2em] backdrop-blur-xl">Buscar</TooltipContent>
          </Tooltip>

          <Popover onOpenChange={(open) => {
            if (open) setHasViewedNotifications(true);
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button id="notifications-trigger" size="icon" variant="ghost" className="relative w-10 h-10 rounded-[14px] hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all duration-500">
                    <Bell className="h-4 w-4" />
                    {hasAlerts && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white/95 dark:bg-[#0A0A0C]/95 border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase px-4 py-2 rounded-xl text-zinc-500 tracking-[0.2em] backdrop-blur-xl">Notificações</TooltipContent>
            </Tooltip>
            <PopoverContent align="center" sideOffset={14} className="w-80 p-0 bg-white/95 dark:bg-[#080809]/95 border border-zinc-200 dark:border-white/10 backdrop-blur-[32px] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden z-[70] ring-1 ring-black/5 dark:ring-white/5">
              <div className="p-5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Notificações</h4>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <AlertsPanel />
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-[14px] ring-offset-background transition-all hover:scale-105 focus:outline-none p-0 overflow-hidden ml-1">
                <Avatar className="h-10 w-10 border border-zinc-200 dark:border-white/10 rounded-[14px]">
                  <AvatarImage src={profile?.avatar_url || ''} alt={fullName} className="object-cover" />
                  <AvatarFallback className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black">
                    {fullName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-[#080809]/95 backdrop-blur-[32px] border border-zinc-200 dark:border-white/10 rounded-[32px] p-3 z-[9999] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/5" sideOffset={14}>
              <div className="flex items-center gap-4 p-3 mb-2">
                <Avatar className="h-12 w-12 border border-zinc-200 dark:border-white/10 rounded-2xl">
                  <AvatarImage src={profile?.avatar_url || ''} alt={fullName} className="object-cover" />
                  <AvatarFallback className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black">
                    {fullName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">{fullName}</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 truncate max-w-[140px] font-bold uppercase tracking-widest">{user?.email || 'Sem e-mail'}</span>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 mx-2 my-2" />

              <DropdownMenuItem className="cursor-pointer rounded-2xl focus:bg-zinc-100 dark:focus:bg-white/[0.04] my-1 py-3 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => navigate('/ajustes')}>
                <Settings className="mr-3 h-4 w-4" />
                <span>Ajustes</span>
              </DropdownMenuItem>

              <div className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/[0.04] select-none transition-all my-1">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Interface</span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-900 dark:hover:bg-white text-zinc-500 hover:text-white dark:hover:text-black">
                  {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <DropdownMenuItem className="cursor-pointer rounded-2xl focus:bg-zinc-100 dark:focus:bg-white/[0.04] my-1 py-3 px-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => navigate('/help')}>
                <HelpCircle className="mr-3 h-4 w-4" />
                <span>Suporte</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 mx-2 my-2" />

              <DropdownMenuItem className="cursor-pointer rounded-2xl focus:bg-rose-500 focus:text-white text-rose-500 my-1 py-3 px-4 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm" onClick={handleLogout}>
                <LogOut className="mr-3 h-4 w-4" />
                <span>Encerrar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandSearch open={isSearchOpen} setOpen={setIsSearchOpen} />
    </nav>
  );
};