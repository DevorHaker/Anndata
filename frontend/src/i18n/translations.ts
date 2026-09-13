export type Language = 'en' | 'hi' | 'pa' | 'gu' | 'mr' | 'te' | 'ta' | 'bn';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'उत्तर भारत (North India)', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', region: 'All India', flag: '🇬🇧' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'ਪੰਜਾਬ (Punjab)', flag: '🌾' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'ગુજરાત (Gujarat)', flag: '🚜' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'महाराष्ट्र (Maharashtra)', flag: '🌱' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'ఆంధ్రప్రదేశ్ / తెలంగాణ', flag: '🌾' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'தமிழ்நாடு (Tamil Nadu)', flag: '🌾' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'पश्चिम बंगाल (West Bengal)', flag: '🌾' },
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & General
    appName: 'Anndata',
    appSubtitle: 'Government Grain Procurement Platform',
    dashboard: 'Dashboard Overview',
    bookings: 'Slot Bookings',
    tokenQueue: 'Token & Mandi Queue',
    procurement: 'Procurement Ops',
    payments: 'DBT Bank Payments',
    intelligence: 'AI Mandi Guidance',
    notifications: 'Notifications',
    offlineOps: 'Offline Mandi Ops',
    syncConflicts: 'Sync Conflicts',
    assistedMode: 'Farmer Voice & Visual Mode',
    language: 'Language',
    selectLanguage: 'Select Language',
    farmerWelcome: 'Welcome Farmers (Kisan Sevak)',
    selectLanguageDesc: 'Choose your language to view live Mandi tokens, MSP rates, and direct bank payout updates.',
    confirmLanguage: 'Confirm & Continue',
    online: 'Online System Active',
    offline: 'Offline Mode (Local Sync Active)',
    limitedConnectivity: 'Limited Network',
    
    // Notifications & Preferences
    notificationsTitle: 'Mandi Alerts & Communication Settings',
    markAllRead: 'Mark All as Read',
    unreadCount: '{count} Unread Alerts',
    smsEnabled: 'SMS Notifications (Farmer Gateway)',
    pushEnabled: 'Web Push Alerts',
    inAppEnabled: 'In-App Alerts',
    preferredLanguage: 'Preferred Farmer Language',
    savePreferences: 'Save Preferences',
    preferencesSaved: 'Notification preferences updated successfully!',
    noNotifications: 'No alerts at this time.',

    // Offline Operations & Sync
    offlineTitle: 'Offline Procurement Centre Operations',
    offlineNotice: 'Operating in Offline Mode. Gate check-ins, weighment entries, and queue updates are saved safely in IndexedDB and will sync automatically when connected.',
    pendingActions: 'Pending Queue Actions: {count}',
    syncNow: 'Sync Now with Server',
    syncSuccess: 'Successfully synchronized {count} offline actions!',
    syncConflictsFound: '{count} conflicts require staff review.',
    offlineCheckinBtn: 'Offline Gate Check-In',
    tokenCodePlaceholder: 'Enter or scan Token Code (e.g. T-023)',
    recordOfflineNote: 'Record Mandi Operational Note',

    // Voice & Assisted Mode
    voiceAssistance: 'Kisan Voice Assistant',
    speakTokenInfo: 'Read Mandi Token Status Aloud',
    listening: 'Listening for farmer voice command...',
    startVoice: 'Voice Search / Command',
    voiceNotSupported: 'Speech recognition is not supported in this browser.',
    
    // Core Domain Labels
    tokenNumber: 'Token Number',
    estimatedWait: 'Estimated Mandi Wait Time',
    centreStatus: 'Mandi Status',
    paymentStatus: 'DBT Direct Payment Status',
    utrNumber: 'Bank Transfer UTR Number',
    amountCredited: 'Amount Credited to Bank Account',
    retry: 'Retry Action'
  },
  hi: {
    // Navigation & General
    appName: 'अन्नदाता',
    appSubtitle: 'सरकारी अनाज खरीद एवं किसान कल्याण मंच',
    dashboard: 'मुख्य डैशबोर्ड',
    bookings: 'मंडी स्लॉट बुकिंग',
    tokenQueue: 'टोकन एवं मंडी कतार',
    procurement: 'अनाज खरीद कार्य',
    payments: 'डीबीटी बैंक खाता भुगतान',
    intelligence: 'एआई मंडी सलाह एवं प्रतीक्षा समय',
    notifications: 'किसान सूचनाएं',
    offlineOps: 'ऑफलाइन मंडी कार्य',
    syncConflicts: 'सिंक विवाद समाधान',
    assistedMode: 'किसान आवाज एवं दृश्य सहायता',
    language: 'भाषा चुनें',
    selectLanguage: 'अपनी भाषा चुनें',
    farmerWelcome: 'किसान भाइयों का स्वागत है',
    selectLanguageDesc: 'अपनी सुविधानुसार भाषा चुनें ताकि आप मंडी टोकन, एमएसपी रेट और बैंक भुगतान की जानकारी आसानी से समझ सकें।',
    confirmLanguage: 'भाषा की पुष्टि करें',
    online: 'ऑनलाइन सिस्टम चालू है',
    offline: 'ऑफलाइन मोड (स्थानीय सिंक चालू है)',
    limitedConnectivity: 'सीमित इंटरनेट कनेक्टिविटी',
    
    // Notifications & Preferences
    notificationsTitle: 'मंडी सूचनाएं एवं अलर्ट सेटिंग्स',
    markAllRead: 'सभी सूचनाएं पढ़ी हुई चिन्हित करें',
    unreadCount: '{count} नई मंडी सूचनाएं',
    smsEnabled: 'एसएमएस अलर्ट (मोबाइल पर)',
    pushEnabled: 'वेब पुश अलर्ट',
    inAppEnabled: 'ऐप सूचनाएं',
    preferredLanguage: 'पसंदीदा किसान भाषा',
    savePreferences: 'प्राथमिकताएं सुरक्षित करें',
    preferencesSaved: 'सूचना प्राथमिकताएं सफलतापूर्वक अपडेट की गईं!',
    noNotifications: 'फिलहाल कोई नई मंडी सूचना नहीं है।',

    // Offline Operations & Sync
    offlineTitle: 'ऑफलाइन मंडी खरीद केंद्र कार्यप्रणाली',
    offlineNotice: 'ऑफलाइन मोड में कार्य चल रहा है। सभी गेट चेक-इन, वजन प्रविष्टियां और टोकन कतार अपडेट फोन/कंप्यूटर में सुरक्षित हैं और इंटरनेट आने पर अपने आप सिंक हो जाएंगे।',
    pendingActions: 'लंबित ऑफलाइन कार्य: {count}',
    syncNow: 'सर्वर के साथ अभी सिंक करें',
    syncSuccess: '{count} कार्य सफलतापूर्वक सिंक किए गए!',
    syncConflictsFound: '{count} विवादों की जांच अधिकारियों द्वारा आवश्यक है।',
    offlineCheckinBtn: 'गेट चेक-इन टोकन दर्ज करें',
    tokenCodePlaceholder: 'टोकन नंबर दर्ज या स्कैन करें (उदा. T-023)',
    recordOfflineNote: 'मंडी कार्य की टिप्पणी लिखें',

    // Voice & Assisted Mode
    voiceAssistance: 'किसान आवाज सहायक (वॉइस असिस्टेंट)',
    speakTokenInfo: 'टोकन स्थिति बोलकर सुनें',
    listening: 'आपकी आवाज सुनी जा रही है...',
    startVoice: 'आवाज द्वारा खोजें या बोलें',
    voiceNotSupported: 'इस फोन/ब्राउज़र में आवाज सुविधा उपलब्ध नहीं है।',
    
    // Core Domain Labels
    tokenNumber: 'टोकन नंबर',
    estimatedWait: 'मंडी में अनुमानित प्रतीक्षा समय',
    centreStatus: 'मंडी खरीद स्थिति',
    paymentStatus: 'डीबीटी बैंक खाते में भुगतान की स्थिति',
    utrNumber: 'बैंक ट्रांसफर यूटीआर (UTR) नंबर',
    amountCredited: 'खाते में जमा हुई राशि',
    retry: 'पुनः प्रयास करें'
  },
  pa: {
    // Navigation & General
    appName: 'ਅੰਨਦਾਤਾ',
    appSubtitle: 'ਸਰਕਾਰੀ ਅਨਾਜ ਖਰੀਦ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਪੋਰਟਲ',
    dashboard: 'ਮੁੱਖ ਡੈਸ਼ਬੋਰਡ',
    bookings: 'ਮੰਡੀ ਸਲਾਟ ਬੁਕਿੰਗ',
    tokenQueue: 'ਟੋਕਨ ਅਤੇ ਮੰਡੀ ਲਾਈਨ',
    procurement: 'ਅਨਾਜ ਖਰੀਦ ਕਾਰਜ',
    payments: 'ਡੀ.ਬੀ.ਟੀ. ਬੈਂਕ ਖਾਤਾ ਭੁਗਤਾਨ',
    intelligence: 'ਏ.ਆਈ. ਮੰਡੀ ਸਲਾਹ ਅਤੇ ਉਡੀਕ ਸਮਾਂ',
    notifications: 'ਕਿਸਾਨ ਸੂਚਨਾਵਾਂ',
    offlineOps: 'ਆਫਲਾਈਨ ਮੰਡੀ ਕੰਮ',
    syncConflicts: 'ਸਿੰਕ ਵਿਵਾਦ ਹੱਲ',
    assistedMode: 'ਕਿਸਾਨ ਅਵਾਜ਼ ਅਤੇ ਦ੍ਰਿਸ਼ ਮੋਡ',
    language: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    selectLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ',
    farmerWelcome: 'ਕਿਸਾਨ ਵੀਰਾਂ ਦਾ ਜੀ ਆਇਆਂ ਨੂੰ',
    selectLanguageDesc: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ ਤਾਂ ਜੋ ਮੰਡੀ ਟੋਕਨ, ਐਮ.ਐਸ.ਪੀ. ਰੇਟ ਅਤੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਪੈਸਿਆਂ ਦੀ ਜਾਣਕਾਰੀ ਆਸਾਨੀ ਨਾਲ ਸਮਝ ਆ ਸਕੇ।',
    confirmLanguage: 'ਭਾਸ਼ਾ ਪੱਕੀ ਕਰੋ',
    online: 'ਆਨਲਾਈਨ ਸਿਸਟਮ ਚਾਲੂ ਹੈ',
    offline: 'ਆਫਲਾਈਨ ਮੋਡ (ਸਥਾਨਕ ਸਿੰਕ ਚਾਲੂ ਹੈ)',
    limitedConnectivity: 'ਘੱਟ ਇੰਟਰਨੈੱਟ',

    // Notifications & Preferences
    notificationsTitle: 'ਮੰਡੀ ਸੂਚਨਾਵਾਂ ਅਤੇ ਅਲਰਟ ਸੈਟਿੰਗਾਂ',
    markAllRead: 'ਸਭ ਪੜ੍ਹੇ ਹੋਏ ਮਾਰਕ ਕਰੋ',
    unreadCount: '{count} ਨਵੀਆਂ ਮੰਡੀ ਖ਼ਬਰਾਂ',
    smsEnabled: 'ਐਸ.ਐਮ.ਐਸ. ਅਲਰਟ (ਮੋਬਾਈਲ ਤੇ)',
    pushEnabled: 'ਵੈੱਬ ਨੋਟੀਫਿਕੇਸ਼ਨ',
    inAppEnabled: 'ਐਪ ਸੂਚਨਾਵਾਂ',
    preferredLanguage: 'ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ',
    savePreferences: 'ਸੈਟਿੰਗਾਂ ਸੰਭਾਲੋ',
    preferencesSaved: 'ਸੈਟਿੰਗਾਂ ਸਫਲਤਾਪੂਰਵਕ ਅੱਪਡੇਟ ਹੋ ਗਈਆਂ!',
    noNotifications: 'ਫਿਲਹਾਲ ਕੋਈ ਨਵੀਂ ਸੂਚਨਾ ਨਹੀਂ ਹੈ।',

    // Offline Operations & Sync
    offlineTitle: 'ਆਫਲਾਈਨ ਮੰਡੀ ਖਰੀਦ ਕੇਂਦਰ',
    offlineNotice: 'ਇੰਟਰਨੈੱਟ ਤੋਂ ਬਿਨਾਂ ਕੰਮ ਚੱਲ ਰਿਹਾ ਹੈ। ਸਾਰੇ ਟੋਕਨ ਅਤੇ ਵਜ਼ਨ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਹਨ ਅਤੇ ਨੈੱਟ ਆਉਣ ਤੇ ਆਪੇ ਸਿੰਕ ਹੋ ਜਾਣਗੇ।',
    pendingActions: 'ਬਾਕੀ ਆਫਲਾਈਨ ਕੰਮ: {count}',
    syncNow: 'ਹੁਣੇ ਸਰਵਰ ਨਾਲ ਸਿੰਕ ਕਰੋ',
    syncSuccess: '{count} ਕੰਮ ਸਫਲਤਾਪੂਰਵਕ ਸਿੰਕ ਹੋ ਗਏ!',
    syncConflictsFound: '{count} ਮਸਲੇ ਅਧਿਕਾਰੀਆਂ ਦੀ ਜਾਂਚ ਲਈ ਬਾਕੀ ਹਨ।',
    offlineCheckinBtn: 'ਗੇਟ ਚੈੱਕ-ਇਨ ਟੋਕਨ ਦਰਜ ਕਰੋ',
    tokenCodePlaceholder: 'ਟੋਕਨ ਨੰਬਰ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ T-023)',
    recordOfflineNote: 'ਮੰਡੀ ਨੋਟ ਲਿਖੋ',

    // Voice & Assisted Mode
    voiceAssistance: 'ਕਿਸਾਨ ਅਵਾਜ਼ ਮਦਦਗਾਰ',
    speakTokenInfo: 'ਟੋਕਨ ਸਥਿਤੀ ਸੁਣੋ',
    listening: 'ਤੁਹਾਡੀ ਅਵਾਜ਼ ਸੁਣੀ ਜਾ ਰਹੀ ਹੈ...',
    startVoice: 'ਅਵਾਜ਼ ਨਾਲ ਖੋਜੋ',
    voiceNotSupported: 'ਇਸ ਫੋਨ ਵਿੱਚ ਅਵਾਜ਼ ਸੁਵਿਧਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।',

    // Core Domain Labels
    tokenNumber: 'ਟੋਕਨ ਨੰਬਰ',
    estimatedWait: 'ਮੰਡੀ ਵਿੱਚ ਲਗਭਗ ਉਡੀਕ ਸਮਾਂ',
    centreStatus: 'ਮੰਡੀ ਖਰੀਦ ਸਥਿਤੀ',
    paymentStatus: 'ਡੀ.ਬੀ.ਟੀ. ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਭੁਗਤਾਨ ਦੀ ਸਥਿਤੀ',
    utrNumber: 'ਬੈਂਕ ਯੂ.ਟੀ.ਆਰ. (UTR) ਨੰਬਰ',
    amountCredited: 'ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੋਈ ਰਕਮ',
    retry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ'
  },
  gu: {
    // Navigation & General
    appName: 'અન્નદાતા',
    appSubtitle: 'સરકારી અનાજ ખરીદી અને કિસાન કલ્યાણ પોર્ટલ',
    dashboard: 'મુખ્ય ડેશબોર્ડ',
    bookings: 'મંડી સ્લોટ બુકિંગ',
    tokenQueue: 'ટોકન અને મંડી લાઇન',
    procurement: 'અનાજ ખરીદી કામગીરી',
    payments: 'ડીબીટી બેંક ખાતામાં ચૂકવણી',
    intelligence: 'એઆઈ મંડી સલાહ અને રાહ જોવાનો સમય',
    notifications: 'ખેડૂત સૂચનાઓ',
    offlineOps: 'ઓફલાઇન મંડી કામગીરી',
    syncConflicts: 'સિંક વિવાદ ઉકેલ',
    assistedMode: 'ખેડૂત અવાજ અને દ્રશ્ય મોડ',
    language: 'ભાષા પસંદ કરો',
    selectLanguage: 'તમારી ભાષા પસંદ કરો',
    farmerWelcome: 'ખેડૂત ભાઈઓનું સ્વાગત છે',
    selectLanguageDesc: 'તમારી અનુકૂળ ભાષા પસંદ કરો જેથી તમે મંડી ટોકન, ટેકાના ભાવ (MSP) અને બેંક પેમેન્ટ સરળતાથી સમજી શકો.',
    confirmLanguage: 'ભાષા કન્ફર્મ કરો',
    online: 'ઓનલાઇન સિસ્ટમ ચાલુ છે',
    offline: 'ઓફલાઇન મોડ (સ્થાનિક સિંક ચાલુ છે)',
    limitedConnectivity: 'ઓછું ઇન્ટરનેટ',

    // Notifications & Preferences
    notificationsTitle: 'મંડી સૂચનાઓ અને અલર્ટ સેટિંગ્સ',
    markAllRead: 'બધા વાંચેલા માર્ક કરો',
    unreadCount: '{count} નવી મંડી સૂચનાઓ',
    smsEnabled: 'એસએમએસ અલર્ટ (મોબાઇલ પર)',
    pushEnabled: 'વેબ નોટિફિકેશન',
    inAppEnabled: 'એપ નોટિફિકેશન',
    preferredLanguage: 'પસંદગીની ખેડૂત ભાષા',
    savePreferences: 'સેટિંગ્સ સાચવો',
    preferencesSaved: 'સેટિંગ્સ સફળતાપૂર્વક અપડેટ થઈ ગઈ!',
    noNotifications: 'હાલમાં કોઈ નવી સૂચના નથી.',

    // Offline Operations & Sync
    offlineTitle: 'ઓફલાઇન ખરીદ કેન્દ્ર કામગીરી',
    offlineNotice: 'ઇન્ટરનેટ વગર કામગીરી ચાલુ છે. બધા ટોકન અને વજનના રેકોર્ડ સુરક્ષિત છે અને નેટ આવતા આપોઆપ સિંક થઈ જશે.',
    pendingActions: 'બાકી ઓફલાઇન કામ: {count}',
    syncNow: 'અત્યારે સિંક કરો',
    syncSuccess: '{count} કામ સફળતાપૂર્વક સિંક થઈ ગયા!',
    syncConflictsFound: '{count} વિવાદો ચકાસણી માટે બાકી છે.',
    offlineCheckinBtn: 'ગેટ ચેક-ઇન ટોકન નોંધો',
    tokenCodePlaceholder: 'ટોકન નંબર લખો (જેમ કે T-023)',
    recordOfflineNote: 'મંડી નોંધ લખો',

    // Voice & Assisted Mode
    voiceAssistance: 'ખેડૂત અવાજ સહાયક',
    speakTokenInfo: 'ટોકન સ્થિતિ સાંભળો',
    listening: 'તમારો અવાજ સંભળાઈ રહ્યો છે...',
    startVoice: 'અવાજથી શોધો',
    voiceNotSupported: 'આ બ્રાઉઝરમાં અવાજ સુવિધા ઉપલબ્ધ નથી.',

    // Core Domain Labels
    tokenNumber: 'ટોકન નંબર',
    estimatedWait: 'મંડીમાં અંદાજિત રાહ જોવાનો સમય',
    centreStatus: 'મંડી ખરીદી સ્થિતિ',
    paymentStatus: 'ડીબીટી બેંક ખાતામાં જમા સ્થિતિ',
    utrNumber: 'બેંક યુટીઆર (UTR) નંબર',
    amountCredited: 'ખાતામાં જમા થયેલી રકમ',
    retry: 'ફરી પ્રયાસ કરો'
  },
  mr: {
    // Navigation & General
    appName: 'अन्नदाता',
    appSubtitle: 'शासकीय धान्य खरेदी व शेतकरी कल्याण प्रणाली',
    dashboard: 'मुख्य डॅशबोर्ड',
    bookings: 'बाजार समिती स्लॉट बुकिंग',
    tokenQueue: 'टोकन व खरेदी रांग',
    procurement: 'धान्य खरेदी कामकाज',
    payments: 'डीबीटी थेट बँक खात्यात जमा',
    intelligence: 'एआय बाजार समिती सल्ला व वाट पाहण्याची वेळ',
    notifications: 'शेतकरी सूचना',
    offlineOps: 'ऑफलाइन खरेदी कामकाज',
    syncConflicts: 'सिंक वाद निराकरण',
    assistedMode: 'शेतकरी आवाज व दृश्य मदत',
    language: 'भाषा निवडा',
    selectLanguage: 'तुमची भाषा निवडा',
    farmerWelcome: 'शेतकरी बांधवांचे स्वागत आहे',
    selectLanguageDesc: 'तुमची सोयीची भाषा निवडा जेणेकरून टोकन क्रमांक, हमीभाव (MSP) आणि थेट बँक खात्यात पैसे जमा झाल्याची माहिती सोप्या भाषेत समजेल.',
    confirmLanguage: 'भाषा निश्चित करा',
    online: 'ऑनलाइन प्रणाली सुरू आहे',
    offline: 'ऑफलाइन मोड (स्थानिक सिंक सुरू आहे)',
    limitedConnectivity: 'मर्यादित इंटरनेट कनेक्टिव्हिटी',

    // Notifications & Preferences
    notificationsTitle: 'बाजार समिती सूचना व संदेश सेटिंग्ज',
    markAllRead: 'सर्व वाचलेले म्हणून चिन्हांकित करा',
    unreadCount: '{count} नवीन सूचना',
    smsEnabled: 'एसएमएस संदेश (मोबाईलवर)',
    pushEnabled: 'वेब नोटिफिकेशन',
    inAppEnabled: 'ॲप सूचना',
    preferredLanguage: 'पसंतीची शेतकरी भाषा',
    savePreferences: 'सेटिंग्ज जतन करा',
    preferencesSaved: 'सेटिंग्ज यशस्वीरीत्या अद्ययावत केल्या!',
    noNotifications: 'सध्या कोणतीही नवीन सूचना नाही.',

    // Offline Operations & Sync
    offlineTitle: 'ऑफलाइन धान्य खरेदी केंद्र',
    offlineNotice: 'इंटरनेटशिवाय कामकाज सुरू आहे. सर्व गेट चेक-इन, वजन नोंदी व टोकन सुरक्षित असून इंटरनेट सुरू झाल्यावर आपोआप सिंक होतील.',
    pendingActions: 'लंबित ऑफलाइन कामे: {count}',
    syncNow: 'आत्ताच सिंक करा',
    syncSuccess: '{count} कामे यशस्वीरीत्या सिंक झाली!',
    syncConflictsFound: '{count} वादांची तपासणी अधिकाऱ्यांकडून आवश्यक आहे.',
    offlineCheckinBtn: 'गेट चेक-इन टोकन नोंदवा',
    tokenCodePlaceholder: 'टोकन क्रमांक टाका (उदा. T-023)',
    recordOfflineNote: 'खरेदी केंद्र टीप लिहा',

    // Voice & Assisted Mode
    voiceAssistance: 'शेतकरी आवाज सहाय्यक',
    speakTokenInfo: 'टोकन माहिती ऐका',
    listening: 'तुमचा आवाज ऐकला जात आहे...',
    startVoice: 'आवाजाने शोधा',
    voiceNotSupported: 'या ब्राऊजरमध्ये आवाज सुविधा उपलब्ध नाही.',

    // Core Domain Labels
    tokenNumber: 'टोकन क्रमांक',
    estimatedWait: 'खरेदी केंद्रात अंदाजित वाट पाहण्याची वेळ',
    centreStatus: 'खरेदी केंद्र स्थिती',
    paymentStatus: 'डीबीटी बँक खात्यात पैसे जमा स्थिती',
    utrNumber: 'बँक यूटीआर (UTR) क्रमांक',
    amountCredited: 'खात्यात जमा झालेली रक्कम',
    retry: 'पुन्हा प्रयत्न करा'
  },
  te: {
    // Navigation & General
    appName: 'అన్నదాత',
    appSubtitle: 'ప్రభుత్వ ధాన్య సేకరణ మరియు రైతు సంక్షేమ పోర్టల్',
    dashboard: 'ముఖ్య డాష్‌బోర్డ్',
    bookings: 'మార్కెట్ స్లాట్ బుకింగ్',
    tokenQueue: 'టోకెన్ మరియు మార్కెట్ వరుస',
    procurement: 'ధాన్యం కొనుగోలు ప్రక్రియ',
    payments: 'డీబీటీ నేరుగా బ్యాంక్ ఖాతా జమ',
    intelligence: 'ఏఐ మార్కెట్ సలహా మరియు వేచి ఉండే సమయం',
    notifications: 'రైతు సమాచారం',
    offlineOps: 'ఆఫ్‌లైన్ కొనుగోలు పనులు',
    syncConflicts: 'సింక్ సమస్యల పరిష్కారం',
    assistedMode: 'రైతు వాయిస్ మరియు విజువల్ మోడ్',
    language: 'భాషను ఎంచుకోండి',
    selectLanguage: 'మీ భాషను ఎంచుకోండి',
    farmerWelcome: 'రైతు సోదరులకు స్వాగతం',
    selectLanguageDesc: 'మీకు అనుకూలమైన భాషను ఎంచుకోండి. మార్కెట్ టోకెన్, మద్దతు ధర (MSP) మరియు బ్యాంక్ డిపాజిట్ వివరాలు సులభంగా తెలుసుకోండి.',
    confirmLanguage: 'భాషను ఖరారు చేయండి',
    online: 'ఆన్‌లైన్ సిస్టమ్ నడుస్తోంది',
    offline: 'ఆఫ్‌లైన్ మోడ్ (లోకల్ సింక్ నడుస్తోంది)',
    limitedConnectivity: 'తక్కువ ఇంటర్నెట్',

    // Notifications & Preferences
    notificationsTitle: 'మార్కెట్ అలర్ట్‌లు మరియు సెట్టింగ్‌లు',
    markAllRead: 'అన్నీ చదివినట్లు మార్క్ చేయండి',
    unreadCount: '{count} కొత్త అలర్ట్‌లు',
    smsEnabled: 'ఎస్‌ఎంఎస్ అలర్ట్‌లు',
    pushEnabled: 'వెబ్ నోటిఫికేషన్‌లు',
    inAppEnabled: 'యాప్ అలర్ట్‌లు',
    preferredLanguage: 'ఎంచుకున్న రైతు భాష',
    savePreferences: 'సెట్టింగ్‌లను సేవ్ చేయండి',
    preferencesSaved: 'సెట్టింగ్‌లు విజయవంతంగా అప్‌డేట్ అయ్యాయి!',
    noNotifications: 'ప్రస్తుతానికి కొత్త సమాచారం లేదు.',

    // Offline Operations & Sync
    offlineTitle: 'ఆఫ్‌లైన్ కొనుగోలు కేంద్రం',
    offlineNotice: 'ఇంటర్నెట్ లేకుండా కొనుగోళ్లు జరుగుతున్నాయి. మీ టోకెన్, బరువు వివరాలు భద్రంగా ఉంటాయి, నెట్ రాగానే సింక్ అవుతాయి.',
    pendingActions: 'మిగిలి ఉన్న పనులు: {count}',
    syncNow: 'ఇప్పుడే సింక్ చేయండి',
    syncSuccess: '{count} పనులు విజయవంతంగా సింక్ అయ్యాయి!',
    syncConflictsFound: '{count} అంశాలు అధికారుల పరిశీలనలో ఉన్నాయి.',
    offlineCheckinBtn: 'గేట్ చెక్-ఇన్ నమోదు చేయండి',
    tokenCodePlaceholder: 'టోకెన్ నంబర్ నమోదు చేయండి (ఉదా: T-023)',
    recordOfflineNote: 'కేంద్రం సమాచారం నమోదు చేయండి',

    // Voice & Assisted Mode
    voiceAssistance: 'రైతు వాయిస్ అసిస్టెంట్',
    speakTokenInfo: 'టోకెన్ వివరాలు వినండి',
    listening: 'మీ మాటలను వింటున్నాము...',
    startVoice: 'వాయిస్ ద్వారా శోధించండి',
    voiceNotSupported: 'ఈ బ్రౌజర్‌లో వాయిస్ సౌకర్యం లేదు.',

    // Core Domain Labels
    tokenNumber: 'టోకెన్ నంబర్',
    estimatedWait: 'మార్కెట్‌లో సుమారు వేచి ఉండే సమయం',
    centreStatus: 'కొనుగోలు కేంద్రం పరిస్థితి',
    paymentStatus: 'డీబీటీ బ్యాంక్ డిపాజిట్ పరిస్థితి',
    utrNumber: 'బ్యాంక్ UTR నంబర్',
    amountCredited: 'ఖాతాలో జమ అయిన మొత్తం',
    retry: 'మళ్లీ ప్రయత్నించండి'
  },
  ta: {
    // Navigation & General
    appName: 'அன்னதாதா',
    appSubtitle: 'அரசு தானிய கொள்முதல் மற்றும் விவசாய நலன் போர்டல்',
    dashboard: 'முதன்மை டாஷ்போர்டு',
    bookings: 'கொள்முதல் மைய ஸ்லாட் முன்பதிவு',
    tokenQueue: 'டோக்கன் மற்றும் வரிசை நிலை',
    procurement: 'தானிய கொள்முதல் பணிகள்',
    payments: 'நேரடி வங்கி கணக்கு பணம் जमा (DBT)',
    intelligence: 'AI கொள்முதல் மையம் வழிகாட்டுதல்',
    notifications: 'விவசாயி அறிவிப்புகள்',
    offlineOps: 'ஆஃப்லைன் கொள்முதல் பணிகள்',
    syncConflicts: 'ஒத்திசைவு பிரச்சனை தீர்வு',
    assistedMode: 'விவசாயி குரல் மற்றும் காட்சி உதவி',
    language: 'மொழியை தேர்ந்தெடுக்கவும்',
    selectLanguage: 'உங்கள் மொழியை தேர்ந்தெடுக்கவும்',
    farmerWelcome: 'விவசாய சகோதரர்களுக்கு வரவேற்பு',
    selectLanguageDesc: 'கொள்முதல் மைய டோக்கன், குறைந்தபட்ச ஆதரவு விலை (MSP) மற்றும் வங்கி பண பரிவர்த்தனை தகவல்களை எளிதாக அறிய மொழியை தேர்வு செய்யவும்.',
    confirmLanguage: 'மொழியை உறுதிப்படுத்துக',
    online: 'ஆன்லைன் சிஸ்டம் இயங்குகிறது',
    offline: 'ஆஃப்லைன் பயன்முறை (உள்ளூர் சிங்க் இயங்குகிறது)',
    limitedConnectivity: 'குறைந்த இணைய இணைப்பு',

    // Notifications & Preferences
    notificationsTitle: 'கொள்முதல் மைய தகவல்கள் மற்றும் அமைப்புகள்',
    markAllRead: 'அனைத்தையும் படித்ததாக குறிக்கவும்',
    unreadCount: '{count} புதிய அறிவிப்புகள்',
    smsEnabled: 'எஸ்.எம்.எஸ் அறிவிப்புகள்',
    pushEnabled: 'இணைய அறிவிப்புகள்',
    inAppEnabled: 'செயலி அறிவிப்புகள்',
    preferredLanguage: 'விரும்பிய விவசாயி மொழி',
    savePreferences: 'அமைப்புகளை சேமிக்கவும்',
    preferencesSaved: 'அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!',
    noNotifications: 'தற்போது புதிய அறிவிப்புகள் இல்லை.',

    // Offline Operations & Sync
    offlineTitle: 'ஆஃப்லைன் தானிய கொள்முதல் மையம்',
    offlineNotice: 'இணையம் இல்லாமல் பணிகள் நடைபெறுகின்றன. டோக்கன் மற்றும் எடை பதிவுகள் பாதுகாப்பாக சேமிக்கப்பட்டு இணையம் வந்ததும் தானாக ஒத்திசைக்கப்படும்.',
    pendingActions: 'நிலுவையில் உள்ள பணிகள்: {count}',
    syncNow: 'இப்போது ஒத்திசைக்கவும்',
    syncSuccess: '{count} பணிகள் வெற்றிகரமாக ஒத்திசைக்கப்பட்டன!',
    syncConflictsFound: '{count} சிக்கல்கள் அதிகாரிகளின் ஆய்வில் உள்ளன.',
    offlineCheckinBtn: 'கேட் செக்-இன் டோக்கன் பதிவு செய்க',
    tokenCodePlaceholder: 'டோக்கன் எண் உள்ளிடவும் (எ.கா. T-023)',
    recordOfflineNote: 'மையத்தின் குறிப்பை பதிவு செய்க',

    // Voice & Assisted Mode
    voiceAssistance: 'விவசாயி குரல் உதவியாளர்',
    speakTokenInfo: 'டோக்கன் நிலையை கேட்கவும்',
    listening: 'உங்கள் குரல் கேட்கப்படுகிறது...',
    startVoice: 'குரல் மூலம் தேடுக',
    voiceNotSupported: 'இந்த உலாவியில் குரல் வசதி இல்லை.',

    // Core Domain Labels
    tokenNumber: 'டோக்கன் எண்',
    estimatedWait: 'கொள்முதல் மையத்தில் எதிர்பார்க்கப்படும் காத்திருப்பு நேரம்',
    centreStatus: 'கொள்முதல் மைய நிலை',
    paymentStatus: 'வங்கி கணக்கில் பணம் জমা நிலை',
    utrNumber: 'வங்கி UTR எண்',
    amountCredited: 'கணக்கில் வரவு வைக்கப்பட்ட தொகை',
    retry: 'மீண்டும் முயற்சிக்கவும்'
  },
  bn: {
    // Navigation & General
    appName: 'অন্নদাতা',
    appSubtitle: 'সরকারি খাদ্যশস্য সংগ্রহ ও কৃষক কল্যাণ পোর্টাল',
    dashboard: 'মূল ড্যাশবোর্ড',
    bookings: 'মান্ডি স্লট বুকিং',
    tokenQueue: 'টোকেন ও মান্ডি লাইন',
    procurement: 'ধান/গম সংগ্রহ কাজ',
    payments: 'ডিবিটি সরাসরি ব্যাঙ্ক অ্যাকাউন্টে টাকা জমা',
    intelligence: 'এআই মান্ডি পরামর্শ ও অপেক্ষার সময়',
    notifications: 'কৃষক তথ্য ও বার্তা',
    offlineOps: 'অফলাইন মান্ডি কাজ',
    syncConflicts: 'সিঙ্ক বিরোধ সমাধান',
    assistedMode: 'কৃষক ভয়েস ও ভিজ্যুয়াল সাপোর্ট',
    language: 'ভাষা নির্বাচন করুন',
    selectLanguage: 'আপনার ভাষা নির্বাচন করুন',
    farmerWelcome: 'কৃষক ভাইদের স্বাগত জানাই',
    selectLanguageDesc: 'সহজে মান্ডি টোকেন, ন্যূনতম সহায়ক মূল্য (MSP) এবং ব্যাঙ্কে টাকা জমার তথ্য জানতে আপনার পছন্দের ভাষা বাছুন।',
    confirmLanguage: 'ভাষা নিশ্চিত করুন',
    online: 'অনলাইন সিস্টেম সক্রিয় রয়েছে',
    offline: 'অফলাইন মোড (লোকাল সিঙ্ক চালু রয়েছে)',
    limitedConnectivity: 'সীমিত ইন্টারনেট',

    // Notifications & Preferences
    notificationsTitle: 'মান্ডি নোটিফিকেশন ও মেসেজ সেটিংস',
    markAllRead: 'সব পড়া হয়েছে বলে চিহ্নিত করুন',
    unreadCount: '{count}টি নতুন মান্ডি নোটিফিকেশন',
    smsEnabled: 'এসএমএস অ্যালার্ট (মোবাইলে)',
    pushEnabled: 'ওয়েব নোটিফিকেশন',
    inAppEnabled: 'অ্যাপ নোটিফিকেশন',
    preferredLanguage: 'পছন্দের কৃষক ভাষা',
    savePreferences: 'সেটিংস সংরক্ষণ করুন',
    preferencesSaved: 'সেটিংস সফলভাবে আপডেট করা হয়েছে!',
    noNotifications: 'বর্তমানে কোনো নতুন নোটিফিকেশন নেই।',

    // Offline Operations & Sync
    offlineTitle: 'অফলাইন খাদ্যশস্য সংগ্রহ কেন্দ্র',
    offlineNotice: 'ইন্টারনেট ছাড়াই কাজ চলছে। সমস্ত গেট চেক-ইন ও ওজনের বিবরণ সুরক্ষিত রয়েছে এবং নেট এলেই নিজে থেকেই সিঙ্ক হয়ে যাবে।',
    pendingActions: 'বাকি অফলাইন কাজ: {count}',
    syncNow: 'এখনই সিঙ্ক করুন',
    syncSuccess: '{count}টি কাজ সফলভাবে সিঙ্ক করা হয়েছে!',
    syncConflictsFound: '{count}টি বিষয় আধিকারিকদের পর্যালোচনার অধীন।',
    offlineCheckinBtn: 'গেট চেক-ইন টোকেন নথিভুক্ত করুন',
    tokenCodePlaceholder: 'টোকেন নম্বর লিখুন (যেমন T-023)',
    recordOfflineNote: 'সংগ্রহ কেন্দ্রের নোট লিখুন',

    // Voice & Assisted Mode
    voiceAssistance: 'কৃষক ভয়েস অ্যাসিস্ট্যান্ট',
    speakTokenInfo: 'টোকেন স্ট্যাটাস শুনে নিন',
    listening: 'আপনার কথা শোনা হচ্ছে...',
    startVoice: 'ভয়েস দিয়ে অনুসন্ধান করুন',
    voiceNotSupported: 'এই ব্রাউজারে ভয়েস সুবিধা উপলব্ধ নেই।',

    // Core Domain Labels
    tokenNumber: 'টোকেন নম্বর',
    estimatedWait: 'মান্ডিতে আনুমানিক অপেক্ষার সময়',
    centreStatus: 'মান্ডি সংগ্রহ কেন্দ্র স্ট্যাটাস',
    paymentStatus: 'ডিবিটি ব্যাঙ্কে সরাসরি টাকা জমা স্ট্যাটাস',
    utrNumber: 'ব্যাঙ্ক ইউটিআর (UTR) নম্বর',
    amountCredited: 'অ্যাঙ্কগে জমা হওয়া টাকার পরিমাণ',
    retry: 'পুনরায় চেষ্টা করুন'
  }
};
