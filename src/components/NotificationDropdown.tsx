import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
//import { Bell, CheckCircle2, ArrowRight, Package, MapPin, Activity, Calendar, IndianRupee, Target, Stethoscope, Pill } from 'lucide-react';
import { Bell, CheckCircle2, ArrowRight, Package, MapPin, Activity, Calendar, IndianRupee, Target, Stethoscope, Truck, AlertTriangle, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router'; 
import { NotificationService, type Notification } from '../services/notificationService';


const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = () => {
      const allNotifs = NotificationService.getNotifications();
      setNotifications(allNotifs.slice(0, 5));
    };

    loadNotifications();

    window.addEventListener('notifications-updated', loadNotifications);
    return () => window.removeEventListener('notifications-updated', loadNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    NotificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead();
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) NotificationService.markAsRead(notif.id);
    if (notif.actionUrl) {
      setIsOpen(false);
      navigate(notif.actionUrl);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // const getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case 'meeting': return <Calendar className="w-4 h-4 text-indigo-500" />;
  //     case 'payment': return <IndianRupee className="w-4 h-4 text-emerald-500" />;
  //     case 'inventory': return <Package className="w-4 h-4 text-rose-500" />;
  //     case 'mr': return <Activity className="w-4 h-4 text-violet-500" />;
  //     case 'gps': return <MapPin className="w-4 h-4 text-blue-500" />;
  //     case 'crm': return <Stethoscope className="w-4 h-4 text-orange-500" />;
  //     default: return <Bell className="w-4 h-4 text-slate-500" />;
  //   }
  // };
    const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'payment': return <IndianRupee className="w-4 h-4 text-emerald-500" />;
      case 'inventory': return <Package className="w-4 h-4 text-rose-500" />;
      case 'mr': return <Activity className="w-4 h-4 text-violet-500" />;
      case 'gps': return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'crm': return <Stethoscope className="w-4 h-4 text-orange-500" />;
      case 'dispatch': return <Truck className="w-4 h-4 text-cyan-500" />;
      case 'expiry': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'target': return <Target className="w-4 h-4 text-green-500" />;
      case 'warehouse': return <Package className="w-4 h-4 text-purple-500" />;
      case 'system': return <Settings className="w-4 h-4 text-slate-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-primary hover:text-indigo-700 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group cursor-pointer ${notif.read ? 'opacity-70' : 'bg-white'}`}
                      >
                        {!notif.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notif.read ? 'bg-slate-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                              {getTypeIcon(notif.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm truncate pr-4 ${notif.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 flex-shrink-0 whitespace-nowrap mt-0.5">
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                              {notif.message}
                            </p>
                            {/* <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate uppercase">
                                {notif.module} 
                              </span>
                              {notif.isActionRequired && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-rose-200">
                                  Action Needed
                                </span>
                              )}
                            </div> */}
                                                        <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate uppercase">
                                {notif.module} 
                              </span>

                              {/* NEW PRIORITY BADGE! */}
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${getPriorityColor(notif.priority)}`}>
                                {notif.priority}
                              </span>

                              {notif.isActionRequired && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-rose-200">
                                  Action Needed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-sm border border-slate-200 text-slate-400 hover:text-primary"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100">
                <Link 
                  to="/workspace/notifications/activity" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-primary hover:text-indigo-700 transition-colors"
                >
                  View All Notifications
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}