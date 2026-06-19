// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';
// import React, { useEffect, useState } from 'react';
// import {
//   Alert,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// interface NotificationItem {
//   id: number;
//   type: 'announcement' | 'stock' | 'birthday' | 'message' | 'expiry' | 'attendance' | 'territory' | 'followup';
//   title: string;
//   message: string;
//   time: string;
//   unread: boolean;
// }

// const SEED_NOTIFICATIONS: NotificationItem[] = [
//   {
//     id: 1,
//     type: 'stock',
//     title: '⚠️ Augmentin 625 Stockout Alert',
//     message: 'Augmentin 625 Duo stock has dropped to 0 at the central warehouse. Expect order delays.',
//     time: 'Today, 10:30 AM',
//     unread: true,
//   },
//   {
//     id: 2,
//     type: 'followup',
//     title: '⏰ Follow-Up Due: Dr. Ramesh',
//     message: 'Scheduled follow-up due today at 04:00 PM for detailing new pediatric drug launches.',
//     time: 'Today, 09:15 AM',
//     unread: true,
//   },
//   {
//     id: 3,
//     type: 'attendance',
//     title: '📋 Check-out Pending Alert',
//     message: 'You checked in at Hyderabad Central but check-out is pending for today. Please update attendance.',
//     time: 'Today, 06:00 PM',
//     unread: true,
//   },
//   {
//     id: 4,
//     type: 'expiry',
//     title: '⏰ Product Expiry Alert: Calpol 500',
//     message: 'Batch CP-102 of Calpol 500 expires in 15 days. Please inspect chemist inventory.',
//     time: 'Yesterday, 02:00 PM',
//     unread: false,
//   },
//   {
//     id: 5,
//     type: 'territory',
//     title: '🗺️ Beat Plan Updated',
//     message: 'Manager Rajesh Kumar updated today\'s beat assignment to Secunderabad A.',
//     time: 'Yesterday, 08:30 AM',
//     unread: false,
//   },
//   {
//     id: 6,
//     type: 'birthday',
//     title: '🎂 Birthday Alert: Dr. Ramesh',
//     message: 'It is Dr. Ramesh\'s birthday today. Don\'t forget to send wishes during your visit.',
//     time: 'Yesterday, 08:00 AM',
//     unread: false,
//   },
//   {
//     id: 7,
//     type: 'message',
//     title: '👤 Manager Message: Target Audit',
//     message: 'Area Manager: Please ensure all tour plans for this week are logged and chemist orders submitted.',
//     time: '2 days ago',
//     unread: false,
//   },
//   {
//     id: 8,
//     type: 'announcement',
//     title: '📢 Q2 Incentive Scheme Released',
//     message: 'The new Q2 incentive structures for field achievements are now live in the ERP portal.',
//     time: '3 days ago',
//     unread: false,
//   }
// ];

// const safeJsonParse = (data: string | null, fallback: any) => {
//   if (!data) return fallback;
//   try {
//     return JSON.parse(data);
//   } catch (err) {
//     console.error('safeJsonParse error in NotificationsScreen:', err);
//     return fallback;
//   }
// };

// const NotificationsScreen = () => {
//   const navigation = useNavigation<any>();
//   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
//   const [activeTab, setActiveTab] = useState<'All' | 'Alerts' | 'Follow-Ups' | 'Announcements'>('All');

//   const customAlert = (title: string, message: string) => {
//     if (Platform.OS === 'web') {
//       window.alert(`${title}\n\n${message}`);
//     } else {
//       Alert.alert(title, message);
//     }
//   };

//   useEffect(() => {
//     loadNotifications();
//   }, []);

//   const loadNotifications = async () => {
//     try {
//       const stored = await AsyncStorage.getItem('@notifications');
//       if (stored) {
//         setNotifications(safeJsonParse(stored, []));
//       } else {
//         // First load, save seed data
//         setNotifications(SEED_NOTIFICATIONS);
//         await AsyncStorage.setItem('@notifications', JSON.stringify(SEED_NOTIFICATIONS));
//       }
//     } catch (e) {
//       console.error('Failed to load notifications from AsyncStorage:', e);
//     }
//   };

//   const handleMarkAllRead = async () => {
//     const updated = notifications.map((n) => ({ ...n, unread: false }));
//     setNotifications(updated);
//     try {
//       await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
//     } catch (e) {
//       console.error('Failed to save read status', e);
//     }
//   };

//   const handleToggleRead = async (id: number) => {
//     const updated = notifications.map((n) => {
//       if (n.id === id) {
//         return { ...n, unread: !n.unread };
//       }
//       return n;
//     });
//     setNotifications(updated);
//     try {
//       await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
//     } catch (e) {
//       console.error('Failed to update single read status', e);
//     }
//   };

//   const handleNotificationPress = async (item: NotificationItem) => {
//     // 1. Mark as read when clicked
//     if (item.unread) {
//       const updated = notifications.map((n) => (n.id === item.id ? { ...n, unread: false } : n));
//       setNotifications(updated);
//       try {
//         await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
//       } catch (e) {
//         console.error('Failed to save read status', e);
//       }
//     }

//     // 2. Route the MR to the correct module
//     switch (item.type) {
//       case 'followup':
//         navigation.navigate('FollowUpReminders');
//         break;
//       case 'expiry':
//         navigation.navigate('ExpiryAlerts');
//         break;
//       case 'attendance':
//         navigation.navigate('Attendance');
//         break;
//       case 'territory':
//         navigation.navigate('TerritoryTracking');
//         break;
//       case 'stock':
//         navigation.navigate('ProductCatalog');
//         break;
//       default:
//         // For general announcements/messages, show the full details in an alert
//         customAlert(item.title, item.message);
//         break;
//     }
//   };

//   const handleClearAll = async () => {
//     const confirm = Platform.OS === 'web'
//       ? window.confirm('Are you sure you want to clear all notifications?')
//       : true;

//     if (confirm) {
//       setNotifications([]);
//       try {
//         await AsyncStorage.setItem('@notifications', JSON.stringify([]));
//         customAlert('Cleared', 'Notification center cleared.');
//       } catch (e) {
//         console.error('Failed to clear notifications', e);
//       }
//     }
//   };

//   const getUnreadCountForTab = (tab: 'All' | 'Alerts' | 'Follow-Ups' | 'Announcements') => {
//     return notifications.filter((item) => {
//       if (!item.unread) return false;
//       if (tab === 'Alerts') {
//         return item.type === 'stock' || item.type === 'expiry' || item.type === 'attendance' || item.type === 'territory';
//       }
//       if (tab === 'Follow-Ups') {
//         return item.type === 'followup';
//       }
//       if (tab === 'Announcements') {
//         return item.type === 'announcement' || item.type === 'message' || item.type === 'birthday';
//       }
//       return true; // 'All'
//     }).length;
//   };

//   const filteredList = notifications.filter((item) => {
//     if (activeTab === 'Alerts') {
//       return item.type === 'stock' || item.type === 'expiry' || item.type === 'attendance' || item.type === 'territory';
//     }
//     if (activeTab === 'Follow-Ups') {
//       return item.type === 'followup';
//     }
//     if (activeTab === 'Announcements') {
//       return item.type === 'announcement' || item.type === 'message' || item.type === 'birthday';
//     }
//     return true; // 'All'
//   });

//   const getAvatarColors = (type: string) => {
//     switch (type) {
//       case 'stock':
//         return { emoji: '⚠️', bg: '#FFE4E6' }; // Soft Red
//       case 'expiry':
//         return { emoji: '⏰', bg: '#FEF3C7' }; // Soft Orange
//       case 'attendance':
//         return { emoji: '📋', bg: '#EFF6FF' }; // Soft Blue
//       case 'territory':
//         return { emoji: '🗺️', bg: '#ECFDF5' }; // Soft Green
//       case 'followup':
//         return { emoji: '📅', bg: '#F5F3FF' }; // Soft Purple
//       case 'birthday':
//         return { emoji: '🎂', bg: '#FDF2F8' }; // Soft Pink
//       case 'message':
//         return { emoji: '💬', bg: '#EFF6FF' }; // Soft Blue
//       default: // announcement
//         return { emoji: '📢', bg: '#FEF3C7' }; // Soft Orange
//     }
//   };

//   const unreadCount = notifications.filter((n) => n.unread).length;

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Text style={styles.backButtonText}>⬅️ Back</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>🔔 Notification Center</Text>
//         <Text style={styles.headerSubtitle}>
//           {unreadCount > 0 ? `You have ${unreadCount} unread message(s)` : 'All caught up!'}
//         </Text>
//       </View>

//       {/* Action Controls Bar */}
//       <View style={styles.controlRow}>
//         <TouchableOpacity onPress={handleMarkAllRead} style={styles.controlBtn}>
//           <Text style={styles.controlBtnText}>✔️ Mark all read</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={handleClearAll} style={styles.controlBtn}>
//           <Text style={[styles.controlBtnText, { color: '#E11D48' }]}>🗑️ Clear all</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Tabs */}
//       <View style={styles.tabBarWrapper}>
//         <ScrollView 
//           horizontal 
//           showsHorizontalScrollIndicator={false} 
//           contentContainerStyle={styles.tabScrollContainer}
//         >
//           {(['All', 'Alerts', 'Follow-Ups', 'Announcements'] as const).map((tab) => {
//             const unreadCountForTab = getUnreadCountForTab(tab);
//             return (
//               <TouchableOpacity
//                 key={tab}
//                 onPress={() => setActiveTab(tab)}
//                 style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
//               >
//                 <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
//                   {tab} {unreadCountForTab > 0 ? `(${unreadCountForTab})` : ''}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>
//       </View>

//       {/* Notifications Scroll */}
//       <ScrollView contentContainerStyle={styles.listContainer}>
//         {filteredList.length > 0 ? (
//           filteredList.map((item) => {
//             const avatar = getAvatarColors(item.type);
//             return (
//               <TouchableOpacity
//                 key={item.id}
//                 activeOpacity={0.8}
//                 onPress={() => handleNotificationPress(item)}
//                 onLongPress={() => handleToggleRead(item.id)}
//                 delayLongPress={300}
//                 style={[styles.card, !item.unread && styles.readCard]}
//               >
//                 {/* Visual indicator category */}
//                 <View style={[styles.avatarContainer, { backgroundColor: avatar.bg }]}>
//                   <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
//                 </View>

//                 <View style={{ flex: 1 }}>
//                   <View style={styles.cardHeader}>
//                     <Text style={[styles.cardTitle, item.unread && styles.unreadText]}>
//                       {item.title}
//                     </Text>
//                     {item.unread && <View style={styles.unreadDot} />}
//                   </View>
//                   <Text style={styles.cardMessage}>{item.message}</Text>
//                   <Text style={styles.cardTime}>{item.time}</Text>
//                 </View>
//               </TouchableOpacity>
//             );
//           })
//         ) : (
//           <View style={styles.emptyCard}>
//             <Text style={styles.emptyText}>No notifications available. You're all caught up!</Text>
//           </View>
//         )}
//         <View style={{ height: 40 }} />
//       </ScrollView>
//     </View>
//   );
// };

// export default NotificationsScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   header: {
//     backgroundColor: '#4F46E5',
//     paddingTop: 60,
//     paddingBottom: 25,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//     position: 'relative',
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     top: 50,
//     zIndex: 10,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   backButtonText: {
//     fontSize: 12,
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: '#E0E7FF',
//     textAlign: 'center',
//     marginTop: 6,
//   },
//   controlRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     marginTop: 15,
//   },
//   controlBtn: {
//     paddingVertical: 6,
//   },
//   controlBtnText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#4F46E5',
//   },
//   tabBarWrapper: {
//     marginTop: 10,
//     marginBottom: 5,
//     height: 40,
//   },
//   tabScrollContainer: {
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     gap: 8,
//   },
//   tabButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#E2E8F0',
//   },
//   activeTabButton: {
//     backgroundColor: '#4F46E5',
//   },
//   tabText: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#64748B',
//   },
//   activeTabText: {
//     color: '#FFFFFF',
//   },
//   listContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 15,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 10,
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04,
//     shadowRadius: 2,
//     elevation: 1,
//     borderLeftWidth: 4,
//     borderLeftColor: '#4F46E5',
//   },
//   readCard: {
//     opacity: 0.65,
//     borderLeftColor: '#CBD5E1',
//   },
//   avatarContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//   },
//   avatarEmoji: {
//     fontSize: 20,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingRight: 10,
//   },
//   cardTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#334155',
//   },
//   unreadText: {
//     color: '#0F172A',
//   },
//   unreadDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#3B82F6',
//   },
//   cardMessage: {
//     fontSize: 13,
//     color: '#475569',
//     marginTop: 4,
//     lineHeight: 18,
//   },
//   cardTime: {
//     fontSize: 11,
//     color: '#94A3B8',
//     marginTop: 8,
//   },
//   emptyCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 30,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.03,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   emptyText: {
//     fontSize: 14,
//     color: '#94A3B8',
//     fontStyle: 'italic',
//   },
// });


/////////////////////////////////////////////////////
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NotificationItem {
  id: string | number;
  type: 'announcement' | 'stock' | 'birthday' | 'message' | 'attendance' | 'territory' | 'followup';
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const safeJsonParse = (data: string | null, fallback: any) => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('safeJsonParse error in NotificationsScreen:', err);
    return fallback;
  }
};

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Alerts' | 'Follow-Ups' | 'Announcements'>('All');

  const customAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDynamicNotifications();
    }, [])
  );

  const loadDynamicNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      const savedNotifs = stored ? safeJsonParse(stored, []) : [];

      const dynamicNotifs: NotificationItem[] = [];
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Generate Follow-Up Alerts
      const docsList = safeJsonParse(await AsyncStorage.getItem('@doctor_visits'), []);
      docsList.forEach((d: any) => {
        if (d.followUpDate && d.followUpDate <= todayStr) {
          dynamicNotifs.push({
            id: `dyn-doc-${d.id}`,
            type: 'followup',
            title: `⏰ Follow-Up Due: Dr. ${d.doctorName}`,
            message: `Scheduled follow-up due for today. Notes: ${d.notes || 'None'}`,
            time: 'Today',
            unread: true,
          });
        }
      });

      const chemistsList = safeJsonParse(await AsyncStorage.getItem('@chemist_visits'), []);
      chemistsList.forEach((c: any) => {
        if (c.followUpDate && c.followUpDate <= todayStr) {
          dynamicNotifs.push({
            id: `dyn-chem-${c.id}`,
            type: 'followup',
            title: `⏰ Follow-Up Due: ${c.shopName}`,
            message: `Scheduled chemist follow-up due for today.`,
            time: 'Today',
            unread: true,
          });
        }
      });

      // 2. Generate Attendance Alerts
      if (await AsyncStorage.getItem('@checked_in') === 'true') {
        const checkedOut = await AsyncStorage.getItem('@checked_out');
        if (checkedOut !== 'true') {
          dynamicNotifs.push({
            id: 'dyn-att-checkout',
            type: 'attendance',
            title: '📋 Check-out Pending Alert',
            message: 'You checked in today but check-out is pending. Please update your attendance before EOD.',
            time: 'Today',
            unread: true,
          });
        }
      }

      // 3. Keep standard system announcements
      const systemMessages: NotificationItem[] = [
        {
          id: 'sys-1',
          type: 'announcement',
          title: '📢 Q2 Incentive Scheme Released',
          message: 'The new Q2 incentive structures for field achievements are now live in the ERP portal.',
          time: '3 days ago',
          unread: false,
        },
        {
          id: 'sys-2',
          type: 'message',
          title: '👤 Manager Message: Target Audit',
          message: 'Area Manager: Please ensure all tour plans for this week are logged and chemist orders submitted.',
          time: '2 days ago',
          unread: false,
        }
      ];

      // Merge dynamic with saved (to preserve 'unread' status if user clicked them)
      const finalNotifs = [...dynamicNotifs, ...systemMessages].map((n: any) => {
        const existing = savedNotifs.find((sn: any) => sn.id === n.id);
        return {
          ...n,
          unread: existing ? existing.unread : n.unread,
        };
      });

      setNotifications(finalNotifs);
      await AsyncStorage.setItem('@notifications', JSON.stringify(finalNotifs));

    } catch (e) {
      console.error('Failed to load notifications from AsyncStorage:', e);
    }
  };

  const handleMarkAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
    try {
      await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save read status', e);
    }
  };

  const handleToggleRead = async (id: string | number) => {
    const updated = notifications.map((n) => {
      if (n.id === id) {
        return { ...n, unread: !n.unread };
      }
      return n;
    });
    setNotifications(updated);
    try {
      await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update single read status', e);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // 1. Mark as read when clicked
    if (item.unread) {
      const updated = notifications.map((n) => (n.id === item.id ? { ...n, unread: false } : n));
      setNotifications(updated);
      try {
        await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save read status', e);
      }
    }

    // 2. Route the MR to the correct module accurately mapped from Dashboard
    switch (item.type) {
      case 'followup':
        navigation.navigate('FollowUpReminders');
        break;
      case 'attendance':
        navigation.navigate('Attendance');
        break;
      case 'territory':
        navigation.navigate('TerritoryTracking');
        break;
      case 'stock':
        navigation.navigate('ProductCatalog');
        break;
      default:
        // For general announcements/messages, show the full details in an alert
        customAlert(item.title, item.message);
        break;
    }
  };

  const handleClearAll = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to clear all notifications?')
      : true;

    if (confirm) {
      setNotifications([]);
      try {
        await AsyncStorage.setItem('@notifications', JSON.stringify([]));
        customAlert('Cleared', 'Notification center cleared.');
      } catch (e) {
        console.error('Failed to clear notifications', e);
      }
    }
  };

  const getUnreadCountForTab = (tab: 'All' | 'Alerts' | 'Follow-Ups' | 'Announcements') => {
    return notifications.filter((item) => {
      if (!item.unread) return false;
      if (tab === 'Alerts') {
        return item.type === 'stock' || item.type === 'attendance' || item.type === 'territory';
      }
      if (tab === 'Follow-Ups') {
        return item.type === 'followup';
      }
      if (tab === 'Announcements') {
        return item.type === 'announcement' || item.type === 'message' || item.type === 'birthday';
      }
      return true; 
    }).length;
  };

  const filteredList = notifications.filter((item) => {
    if (activeTab === 'Alerts') {
      return item.type === 'stock' || item.type === 'attendance' || item.type === 'territory';
    }
    if (activeTab === 'Follow-Ups') {
      return item.type === 'followup';
    }
    if (activeTab === 'Announcements') {
      return item.type === 'announcement' || item.type === 'message' || item.type === 'birthday';
    }
    return true; 
  });

  const getAvatarColors = (type: string) => {
    switch (type) {
      case 'stock': return { emoji: '⚠️', bg: '#FFE4E6' }; 
      case 'attendance': return { emoji: '📋', bg: '#EFF6FF' }; 
      case 'territory': return { emoji: '🗺️', bg: '#ECFDF5' }; 
      case 'followup': return { emoji: '📅', bg: '#F5F3FF' }; 
      case 'birthday': return { emoji: '🎂', bg: '#FDF2F8' }; 
      case 'message': return { emoji: '💬', bg: '#EFF6FF' }; 
      default: return { emoji: '📢', bg: '#FEF3C7' }; 
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notification Center</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 ? `You have ${unreadCount} unread message(s)` : 'All caught up!'}
        </Text>
      </View>

      {/* Action Controls Bar */}
      <View style={styles.controlRow}>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.controlBtn}>
          <Text style={styles.controlBtnText}>✔️ Mark all read</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearAll} style={styles.controlBtn}>
          <Text style={[styles.controlBtnText, { color: '#E11D48' }]}>🗑️ Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBarWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabScrollContainer}
        >
          {(['All', 'Alerts', 'Follow-Ups', 'Announcements'] as const).map((tab) => {
            const unreadCountForTab = getUnreadCountForTab(tab);
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab} {unreadCountForTab > 0 ? `(${unreadCountForTab})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications Scroll */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredList.length > 0 ? (
          filteredList.map((item) => {
            const avatar = getAvatarColors(item.type);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleToggleRead(item.id)}
                delayLongPress={300}
                style={[styles.card, !item.unread && styles.readCard]}
              >
                <View style={[styles.avatarContainer, { backgroundColor: avatar.bg }]}>
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, item.unread && styles.unreadText]}>
                      {item.title}
                    </Text>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardMessage}>{item.message}</Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No notifications available. You're all caught up!</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#4F46E5', paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, position: 'relative' },
  backButton: { position: 'absolute', left: 15, top: 50, zIndex: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  backButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#E0E7FF', textAlign: 'center', marginTop: 6 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 15 },
  controlBtn: { paddingVertical: 6 },
  controlBtnText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  tabBarWrapper: { marginTop: 10, marginBottom: 5, height: 40 },
  tabScrollContainer: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  activeTabButton: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  listContainer: { paddingHorizontal: 20, paddingTop: 15 },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  readCard: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  
  avatarContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarEmoji: { fontSize: 20 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#475569', paddingRight: 10 },
  unreadText: { color: '#0F172A', fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', marginTop: 4 },
  
  cardMessage: { fontSize: 12.5, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  cardTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', marginTop: 40, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic', lineHeight: 22 }
});
