export type Language = 'en' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & General
    appName: 'SmartProcure',
    appSubtitle: 'Government Grain Procurement Platform',
    dashboard: 'Dashboard',
    bookings: 'Bookings & Slots',
    tokenQueue: 'Token & Queue',
    procurement: 'Procurement Ops',
    payments: 'DBT Payments',
    intelligence: 'AI Intelligence',
    notifications: 'Notifications',
    offlineOps: 'Offline Mandi Ops',
    syncConflicts: 'Sync Conflicts',
    assistedMode: 'Farmer Voice & Visual Mode',
    language: 'Language',
    online: 'Online',
    offline: 'Offline (Local Sync Active)',
    limitedConnectivity: 'Limited Connectivity',
    
    // Notifications & Preferences
    notificationsTitle: 'Notification Inbox & Communication Settings',
    markAllRead: 'Mark All as Read',
    unreadCount: '{count} Unread Notifications',
    smsEnabled: 'SMS Notifications (Mock/Gateway)',
    pushEnabled: 'Web Push Notifications',
    inAppEnabled: 'In-App Alerts',
    preferredLanguage: 'Communication Language',
    savePreferences: 'Save Notification Preferences',
    preferencesSaved: 'Notification preferences updated successfully!',
    noNotifications: 'No notifications at this time.',

    // Offline Operations & Sync
    offlineTitle: 'Offline Procurement Centre Operations',
    offlineNotice: 'Operating in Offline Mode. All gate check-ins, weighment entries, and queue updates are saved locally in IndexedDB and will sync automatically when back online.',
    pendingActions: 'Pending Actions Queued: {count}',
    syncNow: 'Sync Now with Server',
    syncSuccess: 'Successfully synchronized {count} offline actions!',
    syncConflictsFound: '{count} conflicts require manual staff review.',
    offlineCheckinBtn: 'Offline Gate Check-In',
    tokenCodePlaceholder: 'Enter or scan Token Code (e.g. T-023)',
    recordOfflineNote: 'Record Operational Note',

    // Voice & Assisted Mode
    voiceAssistance: 'Voice Assistant',
    speakTokenInfo: 'Read Token & Status Aloud',
    listening: 'Listening for voice command...',
    startVoice: 'Voice Search / Command',
    voiceNotSupported: 'Speech recognition is not supported in this browser.',
    
    // Core Domain Labels
    tokenNumber: 'Token Code',
    estimatedWait: 'Estimated Wait',
    centreStatus: 'Mandi Status',
    paymentStatus: 'DBT Payment Status',
    utrNumber: 'Bank UTR Number',
    amountCredited: 'Amount Credited',
    retry: 'Retry Action'
  },
  hi: {
    // Navigation & General
    appName: 'स्मार्ट प्रॉक्योर',
    appSubtitle: 'सरकारी अनाज खरीद मंच',
    dashboard: 'डैशबोर्ड',
    bookings: 'बुकिंग और स्लॉट',
    tokenQueue: 'टोकन और कतार',
    procurement: 'खरीद कार्य',
    payments: 'डीबीटी भुगतान',
    intelligence: 'एआई निर्णय प्रणाली',
    notifications: 'सूचनाएं',
    offlineOps: 'ऑफलाइन मंडी कार्य',
    syncConflicts: 'सिंक विवाद समाधान',
    assistedMode: 'किसान आवाज और दृश्य मोड',
    language: 'भाषा',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन (स्थानीय सिंक सक्रिय)',
    limitedConnectivity: 'सीमित कनेक्टिविटी',
    
    // Notifications & Preferences
    notificationsTitle: 'सूचना इनबॉक्स एवं संचार सेटिंग्स',
    markAllRead: 'सभी को पढ़ा हुआ चिन्हित करें',
    unreadCount: '{count} अपठित सूचनाएं',
    smsEnabled: 'एसएमएस सूचनाएं (मॉक्ड/गेटवे)',
    pushEnabled: 'वेब पुश सूचनाएं',
    inAppEnabled: 'इन-ऐप अलर्ट',
    preferredLanguage: 'संचार भाषा',
    savePreferences: 'सूचना प्राथमिकताएं सहेजें',
    preferencesSaved: 'सूचना प्राथमिकताएं सफलतापूर्वक अपडेट की गईं!',
    noNotifications: 'फिलहाल कोई नई सूचना नहीं है।',

    // Offline Operations & Sync
    offlineTitle: 'ऑफलाइन खरीद केंद्र कार्यप्रणाली',
    offlineNotice: 'ऑफलाइन मोड में कार्य हो रहा है। सभी गेट चेक-इन, वजन प्रविष्टियां और कतार अपडेट स्थानीय रूप से IndexedDB में सुरक्षित हैं और ऑनलाइन होने पर स्वतः सिंक हो जाएंगे।',
    pendingActions: 'लंबित ऑफलाइन कार्य: {count}',
    syncNow: 'सर्वर के साथ अभी सिंक करें',
    syncSuccess: '{count} ऑफलाइन कार्य सफलतापूर्वक सिंक किए गए!',
    syncConflictsFound: '{count} विवादों की समीक्षा कर्मचारियों द्वारा आवश्यक है।',
    offlineCheckinBtn: 'ऑफलाइन गेट चेक-इन दर्ज करें',
    tokenCodePlaceholder: 'टोकन कोड दर्ज या स्कैन करें (उदा. T-023)',
    recordOfflineNote: 'परिचालन टिप्पणी दर्ज करें',

    // Voice & Assisted Mode
    voiceAssistance: 'आवाज सहायक (वॉइस असिस्टेंट)',
    speakTokenInfo: 'टोकन और स्थिति बोलकर सुनाएं',
    listening: 'आपकी आवाज सुनी जा रही है...',
    startVoice: 'आवाज द्वारा खोज/कमांड',
    voiceNotSupported: 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।',
    
    // Core Domain Labels
    tokenNumber: 'टोकन नंबर',
    estimatedWait: 'अनुमानित प्रतीक्षा समय',
    centreStatus: 'मंडी स्थिति',
    paymentStatus: 'डीबीटी भुगतान स्थिति',
    utrNumber: 'बैंक यूटीआर नंबर',
    amountCredited: 'क्रेडिट की गई राशि',
    retry: 'पुनः प्रयास करें'
  }
};
