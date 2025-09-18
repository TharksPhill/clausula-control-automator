
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, FileText, Calendar, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationBellProps {
  onViewAll: () => void;
}

export const NotificationBell = ({ onViewAll }: NotificationBellProps) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    loadNotifications 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract_signed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'contract_expiry':
        return <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'trial_expiry':
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'plan_change':
        return <PenTool className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'contract_revised':
        return <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'contract_signed':
        return 'border-l-green-500 dark:border-l-green-400 bg-green-50/50 dark:bg-green-500/10';
      case 'contract_expiry':
        return 'border-l-orange-500 dark:border-l-orange-400 bg-orange-50/50 dark:bg-orange-500/10';
      case 'trial_expiry':
        return 'border-l-yellow-500 dark:border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-500/10';
      case 'plan_change':
        return 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50/50 dark:bg-blue-500/10';
      case 'contract_revised':
        return 'border-l-purple-500 dark:border-l-purple-400 bg-purple-50/50 dark:bg-purple-500/10';
      default:
        return 'border-l-gray-500 dark:border-l-gray-400 bg-gray-50/50 dark:bg-gray-500/10';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Agora';
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-accent transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0 bg-background border-border">
        <DropdownMenuLabel className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>

        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Carregando notificações...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-0 cursor-pointer focus:bg-accent hover:bg-accent ${
                  !notification.is_read ? 'bg-accent' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`w-full p-4 border-l-4 ${getNotificationColor(notification.type)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.is_read ? 'text-foreground font-semibold' : 'text-foreground/80'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <span className="text-xs text-muted-foreground/70">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-primary hover:text-primary/80 hover:bg-accent"
                onClick={() => {
                  onViewAll();
                  setIsOpen(false);
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
