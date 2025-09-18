import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageHeaderProps {
  title: string;
  showSidebarTrigger?: boolean;
  onNotificationClick?: () => void;
}

const PageHeader = ({ 
  title, 
  showSidebarTrigger = true,
  onNotificationClick 
}: PageHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className={`flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm ${isMobile ? 'pl-16' : ''}`}>
      {!isMobile && showSidebarTrigger && (
        <>
          <SidebarTrigger className="-ml-1 hover:bg-slate-100 transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </>
      )}
      <h1 className="text-xl font-semibold text-slate-800 dark:text-white flex-1">{title}</h1>
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <NotificationBell onViewAll={onNotificationClick || (() => {})} />
        <UserProfileDropdown />
      </div>
    </header>
  );
};

export default PageHeader;