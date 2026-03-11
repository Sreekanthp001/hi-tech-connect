import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import apiFetch from "@/lib/api";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch("/notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            toast.error("Failed to mark notification as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch("/notifications/read-all", { method: "PATCH" });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error("Failed to mark all as read");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-slate-100 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white border-2 border-white">
                        {unreadCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Alerts & Status</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 px-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                >
                                    Mark All Read
                                </Button>
                            )}
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                            )}
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground italic text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-4 border-b last:border-0 hover:bg-slate-50 transition-colors relative group ${!n.isRead ? "bg-blue-50/30" : ""}`}
                                >
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                                    )}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${!n.isRead ? "text-slate-900" : "text-slate-600"}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-2 font-medium">
                                                {new Date(n.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <Check className="h-3 w-3 text-green-600" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 0 && unreadCount === 0 && (
                        <div className="p-3 text-center border-t">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">All Caught Up</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
