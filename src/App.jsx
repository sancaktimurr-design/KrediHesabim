import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Home, PieChart, Users, Receipt, Plus, Trash2, Info, UserPlus, LogIn, Mail, Link as LinkIcon, CalendarClock, Lock, User, Table, X, ArrowRight, ArrowLeft, CheckCircle2, Unlock, CheckSquare, Square, Landmark, Coins, TrendingUp, Share2, DownloadCloud, LineChart, Target, Zap, UploadCloud, Loader2, Scale } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

// --- FIREBASE BAŞLATMA ---
const MY_CUSTOM_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAjS6rSX7XfLXPSFVcREFT8MAZ2Y2uzlxA",
  authDomain: "kredi-hesap-b883f.firebaseapp.com",
  projectId: "kredi-hesap-b883f",
  storageBucket: "kredi-hesap-b883f.firebasestorage.app",
  messagingSenderId: "93822309843",
  appId: "1:93822309843:web:944ab4c31af595c4948b26",
  measurementId: "G-NFP5ECXZKC"
};

const firebaseConfig = MY_CUSTOM_FIREBASE_CONFIG || (typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {});
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function App() {
  // --- UYGULAMA ROTASI & AUTH DURUMU ---
  const [appRoute, setAppRoute] = useState('login'); 
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('overview'); 
  const [viewingPartnerId, setViewingPartnerId] = useState(null); 
  
  const [currentPlanId, setCurrentPlanId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [planError, setPlanError] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // --- WIZARD (KURULUM) STATE'LERİ ---
  const [wizardStep, setWizardStep] = useState(1);
  const [loanType, setLoanType] = useState('Konut Kredisi');
  const [planName, setPlanName] = useState('');
  const [partnerCount, setPartnerCount] = useState(2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [myPlans, setMyPlans] = useState([]);

  // --- HESAPLAMA DURUMU (STATE) ---
  const [property, setProperty] = useState({
    price: 4000000,
    currentValue: 4000000,
    interestRate: 2.89,
    term: 120,
    startDate: new Date().toISOString().slice(0,7),
  });

  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Emlakçı Komisyonu', amount: 80000, isIncluded: true, splitByLoanRatio: false, paidBy: {} },
    { id: 2, name: 'Tapu Harcı', amount: 80000, isIncluded: true, splitByLoanRatio: false, paidBy: {} },
    { id: 3, name: 'Hayat Sigortası', amount: 12000, isIncluded: false, splitByLoanRatio: true, paidBy: {} },
    { id: 4, name: 'Konut / DASK Sigortası', amount: 6500, isIncluded: false, splitByLoanRatio: true, paidBy: {} },
  ]);

  const [partners, setPartners] = useState([
    { id: 1, name: '1. Ortak', uid: '', downPayment: 0, targetShare: 50 },
    { id: 2, name: '2. Ortak', uid: '', downPayment: 0, targetShare: 50 },
  ]);

  const [paidMonths, setPaidMonths] = useState([]);

  // --- YATIRIM, KUR VE DEĞERLEME TAKİBİ DURUMU ---
  const defaultInvRates = { dp: {usd:'', eur:'', gold:''}, exp: {usd:'', eur:'', gold:''}, months: {} };
  const [investmentData, setInvestmentData] = useState({
    1: { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates },
    2: { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates }
  });
  const [currentRates, setCurrentRates] = useState({ usd: '', eur: '', gold: '' });

  // Ayrılık & Değerleme (Skalalar)
  const [valuationScenarios, setValuationScenarios] = useState({
    gold: { name: 'Gram Altın', initial: '', current: '' },
    usd: { name: 'Dolar ($)', initial: '', current: '' },
    eur: { name: 'Euro (€)', initial: '', current: '' },
    wage: { name: 'Asgari Ücret', initial: '', current: '' }
  });
  const [customValuations, setCustomValuations] = useState([]);
  const [showValuationResults, setShowValuationResults] = useState(false);

  // --- FIREBASE AUTH DİNLEYİCİSİ ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ 
          name: user.displayName || 'Ortak', 
          email: user.email, 
          uid: user.uid 
        });
        
        let savedPlans = JSON.parse(localStorage.getItem(`my_plans_${user.uid}`)) || [];
        const oldPlanId = localStorage.getItem('lastPlanId');
        
        // Eski sistemden kalan planı kurtar ve listeye ekle
        if (oldPlanId && !savedPlans.find(p => p.id === oldPlanId)) {
           savedPlans.push({ id: oldPlanId, name: 'Önceki Planım (Kurtarıldı)', type: 'Konut Kredisi' });
           localStorage.setItem(`my_plans_${user.uid}`, JSON.stringify(savedPlans));
        }

        setMyPlans(savedPlans);
        
        setAppRoute(prev => (prev === 'login' || prev === 'register' ? 'lobby' : prev));
      } else {
        setCurrentUser(null);
        setMyPlans([]);
        setAppRoute(prev => (prev === 'dashboard' || prev === 'lobby' || prev === 'wizard' ? 'login' : prev));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FIREBASE VERİTABANI SENKRONİZASYONU ---
  useEffect(() => {
    if (!currentUser || !currentPlanId || appRoute !== 'dashboard') return;

    const docRef = doc(db, 'plans', currentPlanId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && !docSnap.metadata.hasPendingWrites) {
        const data = docSnap.data();
        if (data.property) setProperty(data.property);
        if (data.expenses) setExpenses(data.expenses);
        if (data.partners) setPartners(data.partners);
        if (data.paidMonths) setPaidMonths(data.paidMonths);
        if (data.investmentData) setInvestmentData(data.investmentData);
        if (data.currentRates) setCurrentRates(data.currentRates);
        if (data.valuationScenarios) setValuationScenarios(data.valuationScenarios);
        if (data.customValuations) setCustomValuations(data.customValuations);
      }
    }, (error) => console.error("Veri çekme hatası:", error));

    return () => unsubscribe();
  }, [currentUser, currentPlanId, appRoute]);

  const syncToFirestore = async (updates) => {
    if (!currentUser || !currentPlanId || appRoute !== 'dashboard') return;
    try {
      const docRef = doc(db, 'plans', currentPlanId);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Güncelleme hatası:", e);
    }
  };

  const savePlanToLocal = (id, name, type, uid) => {
     const current = JSON.parse(localStorage.getItem(`my_plans_${uid}`)) || [];
     if (!current.find(p => p.id === id)) {
        const updated = [...current, { id, name, type }];
        localStorage.setItem(`my_plans_${uid}`, JSON.stringify(updated));
        setMyPlans(updated);
     }
  };

  const removePlanFromLocal = (id, e) => {
     e.stopPropagation();
     const updated = myPlans.filter(p => p.id !== id);
     localStorage.setItem(`my_plans_${currentUser.uid}`, JSON.stringify(updated));
     setMyPlans(updated);
  };

  // --- LOBİ VE WIZARD İŞLEMLERİ ---
  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const startWizard = () => {
    setWizardStep(1);
    setPlanName('');
    setPartners([
      { id: 1, name: currentUser.name, uid: currentUser.uid, downPayment: 0, targetShare: 50 }, 
      { id: 2, name: '2. Ortak', uid: '', downPayment: 0, targetShare: 50 }
    ]);
    setProperty({ price: 0, currentValue: 0, interestRate: 2.89, term: 120, startDate: new Date().toISOString().slice(0,7) });
    setPaidMonths([]);
    setInvestmentData({
      1: { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates },
      2: { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates }
    });
    setValuationScenarios({
      gold: { name: 'Gram Altın', initial: '', current: '' },
      usd: { name: 'Dolar ($)', initial: '', current: '' },
      eur: { name: 'Euro (€)', initial: '', current: '' },
      wage: { name: 'Asgari Ücret', initial: '', current: '' }
    });
    setCustomValuations([]);
    setShowValuationResults(false);
    setExpenses([
      { id: 1, name: 'Emlakçı Komisyonu', amount: 0, isIncluded: true, splitByLoanRatio: false, paidBy: {} },
      { id: 2, name: 'Tapu Harcı', amount: 0, isIncluded: true, splitByLoanRatio: false, paidBy: {} },
      { id: 3, name: 'Hayat Sigortası', amount: 0, isIncluded: false, splitByLoanRatio: true, paidBy: {} },
      { id: 4, name: 'Konut / DASK Sigortası', amount: 0, isIncluded: false, splitByLoanRatio: true, paidBy: {} },
    ]);
    setAppRoute('wizard');
  };

  const handlePartnerCountChange = (count) => {
    setPartnerCount(count);
    const newPartners = [];
    const equalShare = Number((100 / count).toFixed(2));
    
    for (let i = 1; i <= count; i++) {
      newPartners.push({
        id: i,
        name: i === 1 ? currentUser.name : `${i}. Ortak`,
        uid: i === 1 ? currentUser.uid : '',
        downPayment: 0,
        targetShare: i === count ? Number((100 - (equalShare * (count - 1))).toFixed(2)) : equalShare
      });
    }
    setPartners(newPartners);
  };

  const handlePartnerShareChange = (id, newShare) => {
    const updated = [...partners];
    const index = updated.findIndex(p => p.id === id);
    updated[index].targetShare = Number(newShare);

    if (partners.length === 2) {
       const otherIndex = index === 0 ? 1 : 0;
       updated[otherIndex].targetShare = Math.max(0, 100 - Number(newShare));
    }
    setPartners(updated);
  };

  const finishWizardAndSave = async () => {
    if (!currentUser) return;
    if (!planName.trim()) { alert("Lütfen planınıza bir isim verin!"); return; }
    const newCode = generateCode();
    
    const finalProperty = { ...property, currentValue: property.price };
    const initialData = { 
      planName,
      loanType,
      property: finalProperty, 
      expenses, 
      partners, 
      paidMonths: [], 
      investmentData, 
      currentRates, 
      valuationScenarios,
      customValuations,
      createdAt: new Date().toISOString() 
    };
    
    try {
      const docRef = doc(db, 'plans', newCode);
      await setDoc(docRef, initialData);
      setCurrentPlanId(newCode);
      savePlanToLocal(newCode, planName, loanType, currentUser.uid);
      setIsUnlocked(false); 
      setDashboardTab('overview');
      setAppRoute('dashboard');
    } catch (e) {
      alert("Plan kaydedilirken hata oluştu.");
    }
  };

  const handleJoinPlan = async (e) => {
    e.preventDefault();
    if (!currentUser || !joinCode) return;
    setPlanError('');
    
    try {
      const formattedCode = joinCode.trim().toUpperCase();
      const docRef = doc(db, 'plans', formattedCode);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedPartners = [...data.partners];
        
        if (!updatedPartners[1].uid && updatedPartners[0].uid !== currentUser.uid) {
           updatedPartners[1].uid = currentUser.uid;
           updatedPartners[1].name = currentUser.name;
           await updateDoc(docRef, { partners: updatedPartners });
           setPartners(updatedPartners);
        }

        setCurrentPlanId(formattedCode);
        savePlanToLocal(formattedCode, data.planName || 'İsimsiz Plan', data.loanType || 'Bilinmiyor', currentUser.uid);
        setIsUnlocked(false);
        setDashboardTab('overview');
        setAppRoute('dashboard');
      } else {
        setPlanError('Plan bulunamadı! Lütfen kodu kontrol edin.');
      }
    } catch (e) {
      setPlanError('Sistemsel bir hata oluştu.');
    }
  };

  // --- GEMINI AI (YAPAY ZEKA İLE OCR OKUMA) ---
  const analyzeImageWithGemini = async (base64Data, mimeType) => {
    const apiKey = ""; // Çevre değişkeni tarafından sağlanacak
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: "Sen finansal verileri anlayan bir uzmansın. Sana gönderdiğim banka ödeme planından (veya evraklardan) şu değerleri bularak bana sadece formatlanmış JSON olarak dön: Toplam Kredi/Ev Tutarı (price), Kredi Aylık Faiz Oranı Yüzdesi (interestRate, örn: 2.89), Vade Süresi (term, ay cinsinden, örn 120), ve İlk Taksit Tarihi (startDate, 'YYYY-MM' formatında)." },
          { inlineData: { mimeType: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            price: { type: "NUMBER", description: "Toplam kredi veya satın alma tutarı" },
            interestRate: { type: "NUMBER", description: "Aylık faiz oranı (virgüllü ise noktaya çevir)" },
            term: { type: "INTEGER", description: "Vade süresi (Ay)" },
            startDate: { type: "STRING", description: "İlk ödeme tarihi YYYY-MM" }
          }
        }
      }
    };

    let attempt = 0;
    const delays = [1000, 2000, 4000, 8000, 16000];

    while (attempt < 6) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("API okunamayan veri döndürdü.");
        
        return JSON.parse(text);
      } catch (error) {
        if (attempt === 5) throw error;
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        attempt++;
      }
    }
  };

  const handleFileUploadAI = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAiError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        const mimeType = file.type;

        try {
           const data = await analyzeImageWithGemini(base64Data, mimeType);
           if(data) {
              setProperty(prev => ({
                 ...prev,
                 price: data.price || prev.price,
                 interestRate: data.interestRate || prev.interestRate,
                 term: data.term || prev.term,
                 startDate: data.startDate || prev.startDate
              }));
           }
        } catch(err) {
           setAiError('Belge okunamadı veya bulanık. Lütfen değerleri manuel girin.');
        } finally {
           setIsAnalyzing(false);
        }
      };
    } catch (error) {
       setAiError('Dosya işlenirken bir hata oluştu.');
       setIsAnalyzing(false);
    }
  };


  // --- VERİ GÜNCELLEME YARDIMCILARI ---
  const updateProperty = (field, value) => {
    const newProp = { ...property, [field]: value };
    setProperty(newProp);
    syncToFirestore({ property: newProp });
  };

  const updateCurrentRates = (field, value) => {
    const newRates = { ...currentRates, [field]: value };
    setCurrentRates(newRates);
    syncToFirestore({ currentRates: newRates });
  };

  const updatePartner = (id, field, value) => {
    const newPartners = partners.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPartners(newPartners);
    syncToFirestore({ partners: newPartners });
  };

  const updateExpense = (id, fieldOrUpdates, value) => {
    const newExp = expenses.map(e => {
      if (e.id === id) {
        if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
          return { ...e, ...fieldOrUpdates };
        }
        return { ...e, [fieldOrUpdates]: value };
      }
      return e;
    });
    setExpenses(newExp);
    syncToFirestore({ expenses: newExp });
  };

  const updateExpensePaidBy = (expId, partnerId, amount) => {
    const newExp = expenses.map(e => {
      if (e.id === expId) {
        const val = amount === '' ? '' : Number(amount);
        return { ...e, paidBy: { ...e.paidBy, [partnerId]: val } };
      }
      return e;
    });
    setExpenses(newExp);
    syncToFirestore({ expenses: newExp });
  };

  const addExpense = () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    const newExp = [...expenses, { id: newId, name: 'Yeni Masraf', amount: 0, isIncluded: false, splitByLoanRatio: false, paidBy: {} }];
    setExpenses(newExp);
    syncToFirestore({ expenses: newExp });
    setExpandedExpenseId(newId);
  };

  const removeExpense = (id) => {
    const newExp = expenses.filter(e => e.id !== id);
    setExpenses(newExp);
    syncToFirestore({ expenses: newExp });
    if (expandedExpenseId === id) setExpandedExpenseId(null);
  };

  const toggleExpenseDetail = (id) => {
    setExpandedExpenseId(prev => prev === id ? null : id);
  };

  const toggleMonthPaid = (month) => {
    const newPaidMonths = paidMonths.includes(month) 
      ? paidMonths.filter(m => m !== month)
      : [...paidMonths, month];
    setPaidMonths(newPaidMonths);
    syncToFirestore({ paidMonths: newPaidMonths });
  };

  const getMonthDateLabel = (startStr, monthIndex) => {
    if (!startStr) return `${monthIndex}. Ay`;
    const date = new Date(`${startStr}-01`);
    date.setMonth(date.getMonth() + monthIndex - 1);
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const updateInvestmentRate = (partnerId, category, field, value) => {
    setInvestmentData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[partnerId]) updated[partnerId] = { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates };
      updated[partnerId].rates[category][field] = value;
      syncToFirestore({ investmentData: updated });
      return updated;
    });
  };

  const updateInvestmentMonthRate = (partnerId, month, field, value) => {
    setInvestmentData(prev => {
      const strMonth = String(month);
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[partnerId]) updated[partnerId] = { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates };
      if (!updated[partnerId].rates.months[strMonth]) {
         updated[partnerId].rates.months[strMonth] = {usd:'', eur:'', gold:''};
      }
      updated[partnerId].rates.months[strMonth][field] = value;
      syncToFirestore({ investmentData: updated });
      return updated;
    });
  };

  const shareInvestmentRates = (partnerId) => {
    const updated = JSON.parse(JSON.stringify(investmentData));
    if (!updated[partnerId]) updated[partnerId] = { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates };
    updated[partnerId].isShared = true;
    setInvestmentData(updated);
    syncToFirestore({ investmentData: updated });
    alert("Kurlarınız başarıyla paylaşıldı. Ortağınız kendi ekranından onayladığında senkronize olacaktır.");
  };

  const acceptSharedRates = (myId, otherId) => {
    const updated = JSON.parse(JSON.stringify(investmentData));
    if (!updated[myId]) updated[myId] = { isShared: false, usePartnerRates: false, acceptedShareFrom: null, rates: defaultInvRates };
    updated[myId].usePartnerRates = true;
    updated[myId].acceptedShareFrom = otherId;
    setInvestmentData(updated);
    syncToFirestore({ investmentData: updated });
    alert("Ortağınızın kurları başarıyla hesabınıza uygulandı.");
  };

  const disconnectSharedRates = (myId) => {
    const updated = JSON.parse(JSON.stringify(investmentData));
    if (!updated[myId]) return;
    updated[myId].usePartnerRates = false;
    updated[myId].acceptedShareFrom = null;
    setInvestmentData(updated);
    syncToFirestore({ investmentData: updated });
  };

  // --- VALUATION METRICS (DEĞERLEME) YARDIMCILARI ---
  const updateScenario = (key, field, value) => {
    const updated = { ...valuationScenarios, [key]: { ...valuationScenarios[key], [field]: value } };
    setValuationScenarios(updated);
    syncToFirestore({ valuationScenarios: updated });
  };

  const updateCustomValuation = (id, field, value) => {
    const updated = customValuations.map(c => c.id === id ? { ...c, [field]: value } : c);
    setCustomValuations(updated);
    syncToFirestore({ customValuations: updated });
  };

  const addCustomValuation = () => {
    const newId = customValuations.length > 0 ? Math.max(...customValuations.map(c => c.id)) + 1 : 1;
    const updated = [...customValuations, { id: newId, name: 'Yeni Skala', initial: '', current: '' }];
    setCustomValuations(updated);
    syncToFirestore({ customValuations: updated });
  };

  const removeCustomValuation = (id) => {
    const updated = customValuations.filter(c => c.id !== id);
    setCustomValuations(updated);
    syncToFirestore({ customValuations: updated });
  };


  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
         setAuthError('Giriş başarısız. Bu e-posta kayıtlı değil veya şifreniz hatalı.');
      } else {
         setAuthError('Giriş yapılırken bir hata oluştu: ' + error.message);
      }
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setCurrentUser({ name, email, uid: userCredential.user.uid });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Şifreniz çok zayıf. Lütfen en az 6 karakterli bir şifre belirleyin.');
      } else {
        setAuthError('Kayıt başarısız oldu: ' + error.message);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError('Google ile giriş iptal edildi veya bir sorun oluştu.');
    }
  };

  const handleGuestLogin = async () => {
    setAuthError('');
    try {
      const userCred = await signInAnonymously(auth);
      await updateProfile(userCred.user, { displayName: 'Misafir Ortak' });
    } catch (error) {
      setAuthError('Misafir girişi başarısız oldu: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPlanId(''); 
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  // --- MATEMATİKSEL HESAPLAMALAR ---
  const calculations = useMemo(() => {
    const totalTargetShare = partners.reduce((sum, p) => sum + (Number(p.targetShare) || 0), 0);
    const isShareValid = Math.abs(totalTargetShare - 100) < 0.01;
    
    let totalTargetBaseValue = property.price || 0; 
    let totalExpenses = 0;

    expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        totalExpenses += amt;
        if (e.isIncluded) {
            totalTargetBaseValue += amt;
        }
    });

    let totalLoanNeeded = 0;
    let totalHouseDownPayment = 0;

    const partnerBaseCalculations = partners.map(p => {
      const shareMultiplier = (Number(p.targetShare) || 0) / 100;
      const targetValue = totalTargetBaseValue * shareMultiplier;
      
      const houseDp = Number(p.downPayment) || 0;
      totalHouseDownPayment += houseDp;
      
      let effectiveDp = houseDp; 
      let totalPaidExpenses = 0;
      
      expenses.forEach(e => {
          const paid = Number(e.paidBy?.[p.id]) || 0;
          if (e.isIncluded) {
              effectiveDp += paid; 
          }
          totalPaidExpenses += paid;
      });

      const requiredLoan = Math.max(0, targetValue - effectiveDp);
      totalLoanNeeded += requiredLoan;

      return { ...p, targetValue, effectiveDp, requiredLoan, shareMultiplier, houseDp, totalPaidExpenses };
    });

    let monthlyInstallment = 0;
    const r = (property.interestRate || 0) / 100;
    const n = property.term || 120;

    if (totalLoanNeeded > 0 && r > 0 && n > 0) {
      monthlyInstallment = totalLoanNeeded * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else if (r === 0 && n > 0) {
      monthlyInstallment = totalLoanNeeded / n;
    }

    const totalLoanCost = monthlyInstallment * n;
    const totalInterest = totalLoanCost - totalLoanNeeded;
    
    const amortizationSchedule = [];
    let currentBalance = totalLoanNeeded;

    for (let i = 1; i <= n; i++) {
      let interestPayment = currentBalance * r;
      let principalPayment = monthlyInstallment - interestPayment;

      if (r === 0) {
        interestPayment = 0;
        principalPayment = totalLoanNeeded / n;
      }

      currentBalance -= principalPayment;
      if (currentBalance < 0) currentBalance = 0; 

      amortizationSchedule.push({
        month: i,
        payment: monthlyInstallment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: currentBalance
      });
    }

    // AŞAMA 2: Ödenen Aylara Göre Gerçek Mülkiyet (Ana Para) Hesabı
    let principalPaidTotal = 0;
    amortizationSchedule.forEach(row => {
      if (paidMonths.includes(row.month)) {
        principalPaidTotal += row.principal;
      }
    });

    const passedMonths = paidMonths.length; 
    const bankRemainingPrincipal = totalLoanNeeded - principalPaidTotal;
    const bankOwnershipPercent = totalTargetBaseValue > 0 ? (bankRemainingPrincipal / totalTargetBaseValue) * 100 : 0;

    // Erken Kapama (Payoff) Hesaplaması: Kalan Ana Para + %2 Yasal Erken Kapama Cezası
    const earlyPayoffPenalty = bankRemainingPrincipal * 0.02;
    const totalEarlyPayoffAmount = bankRemainingPrincipal + earlyPayoffPenalty;

    const partnerResults = partnerBaseCalculations.map(p => {
      const loanShareRatio = totalLoanNeeded > 0 ? p.requiredLoan / totalLoanNeeded : 0;
      const remainingLoanDebt = bankRemainingPrincipal * loanShareRatio; 
      const earlyPayoffShare = totalEarlyPayoffAmount * loanShareRatio; // Ortağa düşen erken kapama tutarı
      
      let outOfPocketExcludedExpenses = 0;
      let automatedExpenses = 0;
      let manualExpenses = 0;
      
      expenses.forEach(e => {
          if (!e.isIncluded) {
              if (e.splitByLoanRatio) {
                  const autoAmt = (Number(e.amount) || 0) * loanShareRatio;
                  outOfPocketExcludedExpenses += autoAmt;
                  automatedExpenses += autoAmt;
              } else {
                  const manualAmt = Number(e.paidBy?.[p.id]) || 0;
                  outOfPocketExcludedExpenses += manualAmt;
                  manualExpenses += manualAmt;
              }
          }
      });

      const totalCalculatedExpenses = p.totalPaidExpenses + automatedExpenses;

      const monthlyContribution = monthlyInstallment * loanShareRatio;
      const principalContribution = totalLoanNeeded * loanShareRatio;
      const interestContribution = totalInterest * loanShareRatio;
      const totalLoanDebtContribution = principalContribution + interestContribution;

      let totalPaidInstallments = 0;
      amortizationSchedule.forEach(row => {
        if (paidMonths.includes(row.month)) {
          totalPaidInstallments += row.payment * loanShareRatio;
        }
      });

      const totalPaidOutHistory = p.houseDp + totalCalculatedExpenses + totalPaidInstallments;
      const totalPaidOutOverall = p.effectiveDp + outOfPocketExcludedExpenses + totalLoanDebtContribution;

      const currentPrincipalPaid = principalPaidTotal * loanShareRatio;
      let currentOwnershipPercent = 0;
      if (totalTargetBaseValue > 0) {
        currentOwnershipPercent = ((p.effectiveDp + currentPrincipalPaid) / totalTargetBaseValue) * 100;
      }

      return {
        ...p,
        loanShareRatio,
        remainingLoanDebt,
        earlyPayoffShare,
        outOfPocketExcludedExpenses,
        totalCalculatedExpenses,
        principalContribution,
        interestContribution,
        totalLoanDebtContribution,
        monthlyContribution,
        totalPaidOutOverall,
        totalPaidOutHistory,
        totalPaidInstallments,
        currentOwnershipPercent,
        currentPrincipalPaid
      };
    });

    return {
      totalHouseDownPayment,
      totalLoanNeeded,
      totalExpenses,
      monthlyInstallment,
      totalInterest,
      partnerResults,
      isShareValid,
      totalTargetShare,
      passedMonths,
      bankOwnershipPercent,
      bankRemainingPrincipal,
      earlyPayoffPenalty,
      totalEarlyPayoffAmount,
      amortizationSchedule,
      totalTargetBaseValue
    };
  }, [property, expenses, partners, paidMonths]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  };

  const formatCurrency = (amount, currencySymbol) => {
    return new Intl.NumberFormat('tr-TR', { style: 'decimal', maximumFractionDigits: 2 }).format(amount) + ' ' + currencySymbol;
  };

  const myPartner = currentUser ? (partners.find(p => p.uid === currentUser.uid) || partners[0]) : partners[0];
  const otherPartner = partners.find(p => p.id !== myPartner.id) || partners[1];
  
  const activeViewPartnerId = viewingPartnerId || myPartner.id;
  const viewedPartner = partners.find(p => p.id === activeViewPartnerId);
  const viewedResults = calculations.partnerResults.find(p => p.id === viewedPartner.id) || calculations.partnerResults[0];

  const myInvData = investmentData[myPartner.id] || { rates: defaultInvRates, usePartnerRates: false };
  const otherInvData = investmentData[otherPartner.id] || { rates: defaultInvRates, isShared: false };
  
  const activeRates = myInvData.usePartnerRates ? otherInvData.rates : myInvData.rates;
  
  const calculateEquivalent = (tryAmount, rate) => {
     const r = Number(rate);
     if (!r || r <= 0 || !tryAmount) return 0;
     return tryAmount / r;
  };

  const totalInvValue = useMemo(() => {
     let usd = 0, eur = 0, gold = 0;
     
     usd += calculateEquivalent(viewedResults.houseDp, activeRates.dp?.usd);
     eur += calculateEquivalent(viewedResults.houseDp, activeRates.dp?.eur);
     gold += calculateEquivalent(viewedResults.houseDp, activeRates.dp?.gold);

     usd += calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.usd);
     eur += calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.eur);
     gold += calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.gold);

     paidMonths.forEach(m => {
        const amt = viewedResults.monthlyContribution;
        const mRates = activeRates.months?.[String(m)] || {};
        usd += calculateEquivalent(amt, mRates.usd);
        eur += calculateEquivalent(amt, mRates.eur);
        gold += calculateEquivalent(amt, mRates.gold);
     });

     return { usd, eur, gold };
  }, [activeRates, viewedResults, paidMonths]);

  const currentHouseValue = property.currentValue || property.price; 
  const grossHouseShareValue = currentHouseValue * (viewedResults.targetShare / 100); 
  const netHouseWealth = grossHouseShareValue - viewedResults.remainingLoanDebt; 

  if (appRoute === 'login' || appRoute === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-10 text-center text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10"><PieChart size={200}/></div>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-md shadow-lg border border-white/30 relative z-10">
              <Landmark size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold relative z-10 tracking-tight">Ortak Kredim</h1>
            <p className="text-indigo-200 mt-2 text-sm relative z-10 font-medium">Adil, Şeffaf ve Analitik Ortaklık Platformu</p>
          </div>
          
          <div className="p-8">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center border border-red-100 font-medium">
                {authError}
              </div>
            )}

            {appRoute === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Hesabınıza Giriş Yapın</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="email" required 
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="ornek@mail.com" 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="password" required 
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="••••••••" 
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mt-2 shadow-md">
                  Giriş Yap
                </button>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">veya</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button type="button" onClick={handleGuestLogin} className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center shadow-md mb-2">
                  <Zap size={18} className="mr-1" /> Şifresiz Hızlı Giriş (Misafir)
                </button>

                <button type="button" onClick={handleGoogleAuth} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm">
                  <GoogleIcon /> Google ile Giriş Yap
                </button>

                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => { setAppRoute('register'); setAuthError(''); }} className="text-indigo-600 text-sm font-medium">Hesabınız yok mu? Hesap Oluştur</button>
                </div>
              </form>
            )}

            {appRoute === 'register' && (
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Yeni Hesap Oluştur</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Adınız Soyadınız</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="text" required 
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="Örn: Ali Yılmaz" 
                      value={name} onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="email" required 
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="ornek@mail.com" 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Şifre (En az 6 hane)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                      type="password" required minLength="6"
                      className="w-full pl-10 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="••••••••" 
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors mt-2 shadow-md">
                  Kayıt Ol
                </button>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">veya</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button type="button" onClick={handleGuestLogin} className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center shadow-md mb-2">
                  <Zap size={18} className="mr-1" /> Şifresiz Hızlı Giriş (Misafir)
                </button>

                <button type="button" onClick={handleGoogleAuth} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm">
                  <GoogleIcon /> Google ile Kayıt Ol
                </button>

                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => { setAppRoute('login'); setAuthError(''); }} className="text-indigo-600 text-sm font-medium">Zaten hesabım var, giriş yap</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (appRoute === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
         <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 p-8 text-center text-white relative">
               <button onClick={handleLogout} className="absolute top-4 right-4 text-indigo-200 hover:text-white" title="Çıkış Yap">
                  <LogIn size={20} className="rotate-180" />
               </button>
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Users size={32} />
               </div>
               <h1 className="text-2xl font-bold">Hoş Geldin, {currentUser?.name}</h1>
               <p className="text-indigo-200 mt-2 text-sm">Devam etmek için bir plan seçin veya oluşturun.</p>
            </div>

            <div className="p-8 space-y-6">
               {planError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 font-medium">
                     {planError}
                  </div>
               )}

               <button onClick={startWizard} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
                  <Plus size={20} /> Yeni Ortaklık Planı Başlat
               </button>

               {myPlans.length > 0 && (
                  <div className="space-y-3 mt-6">
                     <h3 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">Kayıtlı Planlarım</h3>
                     <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                        {myPlans.map(p => (
                           <button key={p.id} onClick={() => { setCurrentPlanId(p.id); setAppRoute('dashboard'); }} className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all text-left group">
                              <div className="flex-1 truncate pr-2">
                                 <div className="font-bold text-indigo-900 truncate">{p.name}</div>
                                 <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1 uppercase tracking-wider"><Home size={12}/> {p.type} • KOD: {p.id}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div onClick={(e) => removePlanFromLocal(p.id, e)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Listeden Çıkar">
                                    <Trash2 size={16}/>
                                 </div>
                                 <ArrowRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={20}/>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">veya mevcut plana katıl</span>
                  <div className="flex-grow border-t border-slate-200"></div>
               </div>

               <form onSubmit={handleJoinPlan} className="space-y-3">
                  <label className="block text-sm font-medium text-slate-600 text-center">Davet Kodu</label>
                  <input 
                     type="text" required
                     className="w-full p-4 text-center text-2xl tracking-[0.5em] uppercase font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white" 
                     placeholder="XXXXXX" maxLength={6}
                     value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                  />
                  <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200">
                     Kodu Onayla ve Katıl
                  </button>
               </form>
            </div>
         </div>
      </div>
    );
  }

  if (appRoute === 'wizard') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans flex flex-col items-center">
         <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-6">
               <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Adım Adım Plan Kurulumu</h2>
               <div className="flex justify-between items-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-300" style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}></div>
                  
                  {[1, 2, 3, 4].map(step => (
                     <div key={step} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${wizardStep >= step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {wizardStep > step ? <CheckCircle2 size={16} /> : step}
                     </div>
                  ))}
               </div>
            </div>

            <div className="p-6 md:p-8 min-h-[400px]">
               {/* ADIM 1: KREDİ TÜRÜ */}
               {wizardStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2 text-center">Planınıza Bir İsim Verin</label>
                        <input 
                           type="text" 
                           value={planName}
                           onChange={(e) => setPlanName(e.target.value)}
                           className="w-full p-4 text-center text-lg rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900 bg-white shadow-sm"
                           placeholder="Örn: Ankara Yazlık, Araba Kredisi..."
                        />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800 text-center">Ne kredisi planlıyorsunuz?</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Konut Kredisi', 'Taşıt (Oto) Kredisi', 'İhtiyaç / Destek Kredisi'].map(type => (
                           <button 
                              key={type}
                              onClick={() => {
                                 if(type === 'Konut Kredisi') setLoanType(type);
                                 else alert("Taşıt ve İhtiyaç kredisi hesaplamaları yakında eklenecektir. Lütfen Konut Kredisi ile devam edin.");
                              }}
                              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${loanType === type ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                           >
                              {type === 'Konut Kredisi' && <Home size={32} className={loanType === type ? 'text-indigo-600' : 'text-slate-400'}/>}
                              {type !== 'Konut Kredisi' && <Calculator size={32} className="text-slate-300"/>}
                              <span className={`font-semibold ${loanType === type ? 'text-indigo-900' : 'text-slate-600'}`}>{type}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {/* ADIM 2: ORTAK SAYISI VE PAYLAR */}
               {wizardStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 text-center">Planınızda kaç kişi ortak olacak?</h3>
                     <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3, 4].map(num => (
                           <button 
                              key={num}
                              onClick={() => handlePartnerCountChange(num)}
                              className={`w-14 h-14 rounded-full font-bold text-lg border-2 transition-all ${partnerCount === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                           >
                              {num}
                           </button>
                        ))}
                     </div>

                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-semibold text-slate-700 mb-2 border-b pb-2">Ortakların İsimleri ve Hedef Sahiplik Oranları (%)</h4>
                        {!calculations.isShareValid && <p className="text-xs text-red-600 font-bold">Toplam sahiplik %100 olmalıdır!</p>}
                        
                        {partners.map(p => (
                           <div key={p.id} className="flex items-center gap-3">
                              <input 
                                 type="text" 
                                 value={p.name} 
                                 onChange={(e) => {
                                    const updated = [...partners];
                                    updated.find(x => x.id === p.id).name = e.target.value;
                                    setPartners(updated);
                                 }}
                                 className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                 placeholder={`${p.id}. Ortak İsmi`}
                              />
                              <div className="relative w-28">
                                 <input 
                                    type="number" 
                                    value={p.targetShare}
                                    onChange={(e) => handlePartnerShareChange(p.id, e.target.value)}
                                    className="w-full p-3 pr-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-indigo-700"
                                 />
                                 <span className="absolute right-3 top-3 text-slate-400 font-medium">%</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* ADIM 3: EVİN FİYATI, KREDİ BİLGİLERİ & PEŞİNATLAR */}
               {wizardStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     
                     <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                           {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
                        </div>
                        <h4 className="font-bold text-indigo-900 mb-1">Yapay Zeka ile Otomatik Doldur</h4>
                        <p className="text-xs text-indigo-700 mb-4 max-w-md">Bankadan aldığınız ödeme planının fotoğrafını (veya PDF'ini) yükleyin. Sistem; tutarı, faizi ve vadeyi sizin için otomatik okusun.</p>
                        
                        <input 
                           type="file" 
                           accept="image/*,application/pdf" 
                           id="ai-upload" 
                           className="hidden" 
                           onChange={handleFileUploadAI} 
                        />
                        <label 
                           htmlFor="ai-upload" 
                           className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm ${isAnalyzing ? 'bg-indigo-300 text-indigo-50 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                           {isAnalyzing ? 'Belge İnceleniyor...' : 'Ödeme Planı Yükle'}
                        </label>
                        {aiError && <p className="text-xs text-red-500 font-bold mt-3">{aiError}</p>}
                     </div>

                     <h3 className="text-lg font-bold text-slate-800 text-center">Ev Değeri, Kredi Bilgileri ve Peşinatlar</h3>
                     
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-semibold text-slate-700 mb-2 border-b pb-2">Temel Kredi ve Fiyat Bilgileri</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Evin Satın Alma Tutarı (TL)</label>
                              <input 
                                 type="number" 
                                 value={property.price || ''}
                                 onChange={(e) => setProperty({...property, price: Number(e.target.value)})}
                                 className="w-full p-3 text-lg rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 bg-white"
                                 placeholder="Örn: 4000000"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Kredi Faiz Oranı (%)</label>
                              <input 
                                 type="number" step="0.01"
                                 value={property.interestRate || ''}
                                 onChange={(e) => setProperty({...property, interestRate: Number(e.target.value)})}
                                 className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                 placeholder="Örn: 2.89"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Vade Süresi (Ay)</label>
                              <input 
                                 type="number" 
                                 value={property.term || ''}
                                 onChange={(e) => setProperty({...property, term: Number(e.target.value)})}
                                 className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                 placeholder="Örn: 120"
                              />
                           </div>
                           <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-slate-700 mb-1">İlk Taksit (Kredi Başlangıç) Tarihi</label>
                              <input 
                                 type="month" 
                                 value={property.startDate || ''}
                                 onChange={(e) => setProperty({...property, startDate: e.target.value})}
                                 className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-semibold text-slate-700 mb-2 border-b pb-2">Kişi Başı Verilen Ev Peşinatı</h4>
                        <p className="text-xs text-slate-500 mb-3">Bu adımda sadece "eve" verilen nakit peşinatları girin. Tapu, emlakçı gibi masraf ödemeleri bir sonraki adımdadır.</p>
                        
                        {partners.map(p => (
                           <div key={p.id} className="flex items-center gap-3">
                              <span className="w-1/3 text-sm font-medium text-slate-700 truncate">{p.name}</span>
                              <div className="relative flex-1">
                                 <input 
                                    type="number" 
                                    value={p.downPayment || ''}
                                    onChange={(e) => {
                                       const updated = [...partners];
                                       updated.find(x => x.id === p.id).downPayment = Number(e.target.value);
                                       setPartners(updated);
                                    }}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                                    placeholder="0 TL"
                                 />
                                 <span className="absolute right-3 top-3 text-slate-400 font-medium">TL</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* ADIM 4: DİĞER MASRAFLAR VE KAYIT */}
               {wizardStep === 4 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 text-center mb-1">Masraflar ve Giderler</h3>
                     <p className="text-xs text-slate-500 text-center mb-4 px-4">Bir masrafı "Evin Maliyetine" eklerseniz kredi sorumluluğunu etkiler. Eklenmeyen masrafları ise isterseniz "Kredi Çekim Oranına" göre otomatik paylaştırabilirsiniz.</p>

                     <div className="space-y-4 h-[50vh] overflow-y-auto pr-2 pb-10">
                        {expenses.map((expense, index) => (
                           <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
                              <button onClick={() => {
                                 const updated = [...expenses];
                                 updated.splice(index, 1);
                                 setExpenses(updated);
                              }} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>

                              <div className="flex flex-col sm:flex-row gap-3 pr-6">
                                 <input 
                                    type="text" 
                                    value={expense.name}
                                    onChange={(e) => {
                                       const updated = [...expenses];
                                       updated[index].name = e.target.value;
                                       setExpenses(updated);
                                    }}
                                    className="flex-1 p-2 border-b border-slate-200 font-bold text-indigo-900 outline-none focus:border-indigo-500"
                                    placeholder="Masraf Adı"
                                 />
                                 <div className="relative w-full sm:w-32">
                                    <input 
                                       type="number" 
                                       value={expense.amount || ''}
                                       onChange={(e) => {
                                          const updated = [...expenses];
                                          updated[index].amount = Number(e.target.value);
                                          setExpenses(updated);
                                       }}
                                       className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                       placeholder="Tutar (TL)"
                                    />
                                 </div>
                              </div>

                              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-indigo-100 cursor-pointer mt-2">
                                 <input 
                                    type="checkbox" 
                                    checked={expense.isIncluded}
                                    onChange={(e) => {
                                       const updated = [...expenses];
                                       updated[index].isIncluded = e.target.checked;
                                       if(e.target.checked) updated[index].splitByLoanRatio = false;
                                       setExpenses(updated);
                                    }}
                                    className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                 />
                                 <div>
                                    <strong className="text-sm text-slate-800 block">Bu masrafı toplam maliyete (evin fiyatına) ekle</strong>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                       {expense.isIncluded ? 'Evet. Ödenen peşinat eve verilmiş sayılır.' : 'Hayır. Krediden bağımsız elden ödenen bir yan giderdir.'}
                                    </p>
                                 </div>
                              </label>

                              {!expense.isIncluded && (
                                 <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100 cursor-pointer">
                                    <input 
                                       type="checkbox" 
                                       checked={expense.splitByLoanRatio}
                                       onChange={(e) => {
                                          const updated = [...expenses];
                                          updated[index].splitByLoanRatio = e.target.checked;
                                          setExpenses(updated);
                                       }}
                                       className="mt-1 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                    />
                                    <div>
                                       <strong className="text-sm text-slate-800 block">Kredi Yükü Oranında Paylaştır (Örn: Sigortalar)</strong>
                                       <p className="text-xs text-slate-500 mt-0.5">
                                          {expense.splitByLoanRatio ? 'Açık: Çekilen kredi oranına göre otomatik paylaştırılır.' : 'Kapalı: Kimin ne kadar ödediğini manuel girersiniz.'}
                                       </p>
                                    </div>
                                 </label>
                              )}

                              {(expense.isIncluded || !expense.splitByLoanRatio) ? (
                                 <div className="pt-3 mt-3 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Kim peşin olarak ne kadar ödedi?</p>
                                    <div className="grid grid-cols-2 gap-2">
                                       {partners.map(p => (
                                          <div key={p.id} className="flex items-center gap-2">
                                             <span className="text-xs text-slate-500 w-16 truncate" title={p.name}>{p.name}:</span>
                                             <input 
                                                type="number" 
                                                value={expense.paidBy?.[p.id] || ''}
                                                onChange={(e) => {
                                                   const updated = [...expenses];
                                                   updated[index].paidBy = { ...updated[index].paidBy, [p.id]: Number(e.target.value) };
                                                   setExpenses(updated);
                                                }}
                                                className="w-full p-1.5 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                                placeholder="0 TL"
                                             />
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ) : (
                                 <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">Otomatik Hesaplanan Paylar</p>
                                    <p className="text-[10px] text-amber-600 mb-2">Kredi hesaplandığında ana ekranda görünecek.</p>
                                 </div>
                              )}
                           </div>
                        ))}
                        
                        <button onClick={() => {
                           const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
                           setExpenses([...expenses, { id: newId, name: 'Yeni Masraf', amount: 0, isIncluded: false, splitByLoanRatio: false, paidBy: {} }]);
                        }} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                           <Plus size={18} /> Yeni Masraf Kalemi Ekle
                        </button>
                     </div>
                  </div>
               )}
            </div>

            {/* Alt Kontrol Butonları */}
            <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
               <button 
                  onClick={() => wizardStep === 1 ? setAppRoute('lobby') : setWizardStep(prev => prev - 1)}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-2"
               >
                  <ArrowLeft size={18}/> {wizardStep === 1 ? 'İptal' : 'Geri'}
               </button>

               {wizardStep < 4 ? (
                  <button 
                     onClick={() => {
                        if(wizardStep === 2 && !calculations.isShareValid) {
                           alert("Sahiplik oranları toplamı %100 olmalıdır!"); return;
                        }
                        setWizardStep(prev => prev + 1)
                     }}
                     className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-200"
                  >
                     İleri <ArrowRight size={18}/>
                  </button>
               ) : (
                  <button 
                     onClick={() => {
                        finishWizardAndSave();
                     }}
                     className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md shadow-emerald-200"
                  >
                     Planı Oluştur <CheckCircle2 size={18}/>
                  </button>
               )}
            </div>
         </div>
      </div>
    );
  }

  // 4. ANA DASHBOARD EKRANI
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-12">
      
      {/* Üst Navigasyon */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="text-indigo-600" size={24} />
            <span className="font-bold text-lg text-slate-800">Ortak Kredim</span>
            <span className="ml-2 px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Senkronize
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden md:block">Hoş geldin, {currentUser?.name}</span>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <UserPlus size={16} /> <span className="hidden sm:inline">Ortak Davet Et</span>
            </button>
            <button onClick={() => { setAppRoute('lobby'); setCurrentPlanId(''); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Plandan Çık (Lobiye Dön)">
              <LogIn size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      </nav>

      {/* Davet Modalı */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative">
             <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Ortağınızı Davet Edin</h3>
             <p className="text-slate-500 text-sm mb-6">Aşağıdaki kodu ortağınızla paylaşarak onun da bu plana kendi telefonundan erişmesini sağlayabilirsiniz.</p>
             
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mb-4">
               <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Davet Kodu</span>
               <span className="text-3xl font-bold tracking-widest text-indigo-600">{currentPlanId}</span>
             </div>
             
             <button onClick={() => { navigator.clipboard.writeText(currentPlanId); alert("Kod kopyalandı!"); }} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
               <LinkIcon size={18} /> Kodu Kopyala
             </button>
          </div>
        </div>
      )}

      {/* Amortisman Modalı (Gerçek Taksit Ödeme) */}
      {showAmortizationModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><Table size={24} /></div>
                   <div>
                     <h3 className="text-xl font-bold text-slate-800">Detaylı Ödeme Planı (Gerçek Taksit Takibi)</h3>
                     <p className="text-sm text-slate-500">Taksitleri <strong>Ödendi</strong> olarak işaretledikçe, mülkiyet oranınız anlık güncellenir.</p>
                   </div>
                </div>
                <button onClick={() => setShowAmortizationModal(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-2 rounded-full shadow-sm border"><X size={20}/></button>
             </div>
             
             <div className="overflow-y-auto p-6 bg-white rounded-b-2xl">
               <table className="w-full text-left border-collapse text-sm">
                  <thead>
                     <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <th className="p-3 font-semibold rounded-tl-lg">Durum</th>
                        <th className="p-3 font-semibold">Taksit / Ay</th>
                        <th className="p-3 font-semibold">Taksit Tutarı</th>
                        <th className="p-3 font-semibold text-emerald-600 hidden sm:table-cell">Ana Para</th>
                        <th className="p-3 font-semibold text-red-500 hidden sm:table-cell">Faiz</th>
                        <th className="p-3 font-semibold hidden md:table-cell">Kalan Borç</th>
                     </tr>
                  </thead>
                  <tbody>
                     {calculations.amortizationSchedule.map((row, index) => {
                        const isPaid = paidMonths.includes(row.month);
                        return (
                        <tr key={index} className={`border-b border-slate-100 transition-colors ${isPaid ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                           <td className="p-3">
                              <button 
                                 onClick={() => toggleMonthPaid(row.month)} 
                                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                 {isPaid ? <CheckSquare size={16}/> : <Square size={16}/>}
                                 {isPaid ? 'ÖDENDİ' : 'Bekliyor'}
                              </button>
                           </td>
                           <td className="p-3">
                              <div className="font-medium text-slate-800">{row.month}. Taksit</div>
                              <div className="text-xs text-slate-500">{getMonthDateLabel(property.startDate, row.month)}</div>
                           </td>
                           <td className="p-3 font-bold">{formatMoney(row.payment)}</td>
                           <td className="p-3 text-emerald-600 hidden sm:table-cell">{formatMoney(row.principal)}</td>
                           <td className="p-3 text-red-400 hidden sm:table-cell">{formatMoney(row.interest)}</td>
                           <td className="p-3 text-slate-500 hidden md:table-cell">{formatMoney(row.remainingBalance)}</td>
                        </tr>
                     )})}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* DASHBOARD İÇERİĞİ (Sekmeler ve Paneller) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Sekmeler */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-slate-200 overflow-x-auto pb-1">
           <button 
             onClick={() => setDashboardTab('overview')} 
             className={`pb-3 font-bold text-sm px-2 sm:px-4 transition-colors whitespace-nowrap ${dashboardTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
           >
             Genel Durum & Plan
           </button>
           <button 
             onClick={() => setDashboardTab('payments')} 
             className={`pb-3 font-bold text-sm px-2 sm:px-4 transition-colors flex items-center gap-2 whitespace-nowrap ${dashboardTab === 'payments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
           >
             Ödemelerim & Yatırım Analizi
           </button>
           <button 
             onClick={() => setDashboardTab('valuation')} 
             className={`pb-3 font-bold text-sm px-2 sm:px-4 transition-colors flex items-center gap-2 whitespace-nowrap ${dashboardTab === 'valuation' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-400'}`}
           >
             <Scale size={16}/> Ayrılık & Değerleme
           </button>
        </div>

        {!calculations.isShareValid && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 mb-6">
            <Info size={24} className="shrink-0"/>
            <p className="font-medium text-sm">
              Hedef Sahiplik Oranları toplamı %100 olmalıdır. Şu anki toplam: <strong>%{calculations.totalTargetShare}</strong>.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEKMELER : GENEL DURUM */}
        {/* ========================================================================= */}
        {dashboardTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* SOL PANEL (GİRDİLER) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Mülk ve Kredi */}
              <section className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${!isUnlocked ? 'border-slate-200' : 'border-indigo-300 ring-2 ring-indigo-50'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 pb-3 border-b border-slate-100 gap-3">
                   <div className="flex items-center gap-2">
                     <Home className="text-indigo-600" size={20} />
                     <h2 className="text-lg font-semibold text-slate-800">Evin Fiyatı ve Kredi Çarpanları</h2>
                   </div>
                   <button 
                      onClick={() => setIsUnlocked(!isUnlocked)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isUnlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                      {isUnlocked ? <Unlock size={16}/> : <Lock size={16}/>}
                      {isUnlocked ? 'Kilitle' : 'Kilidi Aç'}
                   </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Evin Fiyatı (TL)</label>
                    <input 
                      type="number" disabled={!isUnlocked}
                      className="w-full p-3 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                      value={property.price || ''}
                      onChange={(e) => updateProperty('price', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Kredi Faizi (%)</label>
                    <input 
                      type="number" step="0.01" disabled={!isUnlocked}
                      className="w-full p-3 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={property.interestRate || ''}
                      onChange={(e) => updateProperty('interestRate', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Vade (Ay)</label>
                    <input 
                      type="number" disabled={!isUnlocked}
                      className="w-full p-3 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={property.term || ''}
                      onChange={(e) => updateProperty('term', Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-2 md:col-span-4 mt-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
                      <CalendarClock size={16}/> Kredi Başlangıç Tarihi
                    </label>
                    <input 
                      type="month" disabled={!isUnlocked}
                      className="w-full md:w-1/2 p-3 disabled:bg-slate-100 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={property.startDate}
                      onChange={(e) => updateProperty('startDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Gerçek Taksit Takibi Butonu */}
                <button 
                   onClick={() => setShowAmortizationModal(true)}
                   className="w-full mt-5 flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                   <Table size={18} /> 📅 Ödeme Planı (Ödenen Taksitleri İşaretle)
                </button>
              </section>

              {/* 2. Ortaklar ve Hedefler */}
              <section className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${!isUnlocked ? 'border-slate-200' : 'border-indigo-300 ring-2 ring-indigo-50'}`}>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="text-indigo-600" size={20} />
                    <h2 className="text-lg font-semibold text-slate-800">Ortaklık Oranları & Ana Peşinat</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div key={partner.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">İsim</label>
                          <input 
                            type="text" disabled={!isUnlocked}
                            className="w-full p-2.5 disabled:bg-slate-100 border border-slate-200 rounded-lg outline-none bg-white focus:border-indigo-500"
                            value={partner.name}
                            onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider text-indigo-600">Hedef Sahiplik</label>
                          <div className="relative">
                            <input 
                              type="number" disabled={!isUnlocked}
                              className="w-full p-2.5 disabled:bg-slate-100 border border-slate-200 rounded-lg outline-none bg-white focus:border-indigo-500 pr-8 font-bold"
                              value={partner.targetShare === 0 ? '' : partner.targetShare}
                              onChange={(e) => {
                                 const updated = [...partners];
                                 const idx = updated.findIndex(p => p.id === partner.id);
                                 const val = Number(e.target.value);
                                 updated[idx].targetShare = val;
                                 if(updated.length === 2) {
                                    updated[idx===0?1:0].targetShare = Math.max(0, 100 - val);
                                 }
                                 setPartners(updated);
                                 syncToFirestore({ partners: updated });
                              }}
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 font-medium">%</span>
                          </div>
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Eve Verilen Peşinat (TL)</label>
                          <input 
                            type="number" disabled={!isUnlocked}
                            className="w-full p-2.5 disabled:bg-slate-100 border border-slate-200 rounded-lg outline-none bg-white focus:border-indigo-500"
                            value={partner.downPayment === 0 ? '' : partner.downPayment}
                            onChange={(e) => updatePartner(partner.id, 'downPayment', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Bağımsız Masraflar Listesi */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="text-indigo-600" size={20} />
                      <h2 className="text-lg font-semibold text-slate-800">Tüm Yan Masraflar</h2>
                    </div>
                    <button onClick={addExpense} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                      <Plus size={16} /> Kalem Ekle
                    </button>
                </div>
                
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      
                      {/* Üst Satır */}
                      <div className="flex items-center gap-3 mb-4">
                        <input 
                          type="text" 
                          className="flex-1 text-sm font-bold text-indigo-900 outline-none border-b border-slate-200 focus:border-indigo-500 pb-1"
                          value={expense.name}
                          placeholder="Masraf Adı"
                          onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                        />
                        <input 
                          type="number" 
                          className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          value={expense.amount === 0 ? '' : expense.amount}
                          placeholder="Tutar (TL)"
                          onChange={(e) => updateExpense(expense.id, 'amount', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                        <button onClick={() => removeExpense(expense.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Sil">
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Hızlı Seçim Butonları */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-4 border-b border-slate-100 pb-4">
                         <button 
                            onClick={() => {
                               updateExpense(expense.id, {
                                  isIncluded: !expense.isIncluded,
                                  ...(!expense.isIncluded ? { splitByLoanRatio: false } : {})
                               });
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors flex-1 justify-center ${expense.isIncluded ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                         >
                            <CheckCircle2 size={18} className={expense.isIncluded ? 'text-indigo-600' : 'text-transparent'} />
                            <span className="text-sm font-semibold">Maliyete Ekle (Krediyi Etkiler)</span>
                         </button>

                         {!expense.isIncluded && (
                            <button 
                               onClick={() => updateExpense(expense.id, 'splitByLoanRatio', !expense.splitByLoanRatio)}
                               className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors flex-1 justify-center ${expense.splitByLoanRatio ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                               <CheckCircle2 size={18} className={expense.splitByLoanRatio ? 'text-amber-500' : 'text-transparent'} />
                               <span className="text-sm font-semibold">Kredi Oranına Göre Böl</span>
                            </button>
                         )}
                      </div>

                      {/* Kim Ödedi Detayı */}
                      {(expense.isIncluded || !expense.splitByLoanRatio) ? (
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Kim peşin olarak ne kadar ödedi?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {partners.map(p => (
                                 <div key={p.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                                    <span className="text-sm text-slate-600 font-medium w-20 truncate">{p.name}:</span>
                                    <input 
                                       type="number" 
                                       value={expense.paidBy?.[p.id] !== undefined ? expense.paidBy[p.id] : ''}
                                       onChange={(e) => updateExpensePaidBy(expense.id, p.id, e.target.value)}
                                       className="flex-1 p-1 text-sm font-semibold border-b border-transparent focus:border-indigo-500 outline-none"
                                       placeholder="0 TL"
                                    />
                                 </div>
                               ))}
                            </div>
                         </div>
                      ) : (
                         <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                             <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wider">Otomatik Hesaplanan Paylar (Kredi Yükü)</p>
                             <div className="grid grid-cols-2 gap-3">
                                {calculations.partnerResults.map(p => (
                                    <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-amber-50">
                                       <span className="text-xs font-medium text-slate-600 truncate mr-2">{p.name}</span>
                                       <span className="text-sm font-bold text-amber-600">{formatMoney((expense.amount || 0) * p.loanShareRatio)}</span>
                                    </div>
                                ))}
                             </div>
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* SAĞ PANEL (SONUÇLAR) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Anlık Sahiplik Durumu */}
              <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><PieChart size={100}/></div>
                <h2 className="text-xl font-bold mb-1 relative z-10">Gerçek Mülkiyet Dağılımı</h2>
                <p className="text-slate-400 text-sm mb-6 relative z-10 flex items-center gap-2">
                  <CheckSquare size={14} className="text-emerald-400"/> {calculations.passedMonths} Taksit Ödendi Olarak İşaretlendi
                </p>

                <div className="text-xs text-slate-300 mb-2 font-medium">Toplam Proje Maliyeti ({formatMoney(calculations.totalTargetBaseValue)}) içindeki mülkiyet</div>
                
                <div className="h-8 w-full rounded-full flex overflow-hidden mb-5 bg-slate-800 border border-slate-700 shadow-inner">
                  {calculations.isShareValid && calculations.partnerResults.map((p, index) => {
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'];
                    return (
                      <div 
                        key={`bar-${p.id}`} 
                        className={`${colors[index % colors.length]} h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-700`}
                        style={{ width: `${p.currentOwnershipPercent}%` }}
                        title={`${p.name}: %${p.currentOwnershipPercent.toFixed(2)}`}
                      >
                        {p.currentOwnershipPercent > 8 && `%${p.currentOwnershipPercent.toFixed(1)}`}
                      </div>
                    )
                  })}
                  <div 
                    className="bg-slate-600 h-full flex items-center justify-center text-xs font-bold text-slate-300 transition-all duration-700"
                    style={{ width: `${calculations.bankOwnershipPercent}%` }}
                    title={`Banka (Kalan Borç): %${calculations.bankOwnershipPercent.toFixed(2)}`}
                  >
                    {calculations.bankOwnershipPercent > 8 && `Banka: %${calculations.bankOwnershipPercent.toFixed(1)}`}
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  {calculations.partnerResults.map((p, index) => {
                     const colors = ['text-emerald-400', 'text-blue-400', 'text-amber-400', 'text-purple-400'];
                     return (
                       <div key={`leg-${p.id}`} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                         <span className="font-medium flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length].replace('text-', 'bg-')}`}></div>
                            {p.name}
                         </span>
                         <span className={`font-bold ${colors[index % colors.length]}`}>
                           %{p.currentOwnershipPercent.toFixed(2)}
                         </span>
                       </div>
                     )
                  })}
                  <div className="flex justify-between items-center text-sm pt-1 border-b border-slate-800 pb-2">
                     <span className="font-medium text-slate-400 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                        Banka (Kalan Ana Para)
                     </span>
                     <span className="font-bold text-slate-400">
                       %{calculations.bankOwnershipPercent.toFixed(2)}
                     </span>
                   </div>
                </div>
              </section>

              {/* Kişi Bazlı Ödeme Raporu */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Kişisel Ödeme Planları</h2>
                
                <div className="space-y-5">
                  {calculations.partnerResults.map((p) => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                        <div>
                          <h3 className="text-lg font-bold text-indigo-900">{p.name}</h3>
                          <div className="mt-1.5 flex flex-col gap-1">
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded w-max">
                              Aylık Taksit Yükü: %{(p.loanShareRatio * 100).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              (Kendi Çektiği Net Kredi İhtiyacı: {formatMoney(p.requiredLoan)})
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Aylık Kredi Ödemesi</span>
                          <span className="text-lg font-black text-indigo-700 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm">
                            {formatMoney(p.monthlyContribution)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-slate-600 bg-white p-2 rounded border border-slate-100">
                           <span className="font-medium">Hesaba Sayılan Peşinatı:</span>
                           <span className="font-bold text-emerald-600">{formatMoney(p.effectiveDp)}</span>
                        </div>
                        
                        <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                          <div className="text-xs font-bold text-red-800 uppercase mb-2">Üstlendiği Toplam Kredi Borcu</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-600 text-xs">
                              <span>Sadece Ana Para:</span>
                              <span className="font-medium">{formatMoney(p.principalContribution)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 text-xs">
                              <span>Banka Faizi:</span>
                              <span className="font-medium">{formatMoney(p.interestContribution)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-red-200/50">
                              <span className="font-bold text-red-900 text-sm">Krediden Düşen Toplam Borç:</span>
                              <span className="font-black text-red-700 text-sm">{formatMoney(p.totalLoanDebtContribution)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-slate-600 bg-white p-2 rounded border border-slate-100">
                           <div className="flex justify-between items-center">
                              <span className="font-medium">Kredi Dışı Ek Masrafı:</span>
                              <span className="font-bold text-amber-600">{formatMoney(p.outOfPocketExcludedExpenses)}</span>
                           </div>
                           <span className="text-[10px] text-slate-400">Riske göre (Otomatik) veya Peşin (Manuel) ödenen tüm yan giderler.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
                   <div className="flex justify-between text-sm text-slate-600 bg-indigo-50 p-2 rounded border border-indigo-100 mb-3">
                      <span className="font-bold text-indigo-900">Banka Toplam Aylık Taksidi:</span>
                      <span className="font-black text-indigo-900">{formatMoney(calculations.monthlyInstallment)}</span>
                   </div>
                   {calculations.totalExpenses > 0 && (
                     <div className="flex justify-between text-sm text-slate-600">
                        <span className="font-semibold text-indigo-800">Hedeflenen Toplam Maliyet (Ev + Masraf):</span>
                        <span className="font-bold text-indigo-900">{formatMoney(calculations.totalTargetBaseValue)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-sm text-slate-600">
                     <span>Çekilen Kredi Ana Para:</span>
                     <span className="font-bold text-slate-800">{formatMoney(calculations.totalLoanNeeded)}</span>
                   </div>
                   <div className="flex justify-between text-sm text-slate-600">
                     <span>Banka Toplam Geri Ödeme (Ana Para + Faiz):</span>
                     <span className="font-bold text-red-600">{formatMoney(calculations.totalLoanNeeded + calculations.totalInterest)}</span>
                   </div>
                </div>

                {/* YENİ: KREDİ KAPAMA TUTARI */}
                <div className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-emerald-900 flex items-center gap-2"><Zap size={18}/> Güncel Erken Kapama Tutarı</span>
                      <span className="text-2xl font-black text-emerald-700">{formatMoney(calculations.totalEarlyPayoffAmount)}</span>
                   </div>
                   <p className="text-[11px] text-emerald-600 mb-4 pb-3 border-b border-emerald-200/60 leading-relaxed">
                      Krediyi <strong>bugün</strong> kapatmak isterseniz kalan ana para ({formatMoney(calculations.bankRemainingPrincipal)}) üzerine yasal maksimum olan %2 oranında erken kapama cezası ({formatMoney(calculations.earlyPayoffPenalty)}) eklenerek hesaplanmıştır. Gelecek ayların faizi silinir.
                   </p>
                   
                   <div className="space-y-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2">Kişilere Düşen Kapama Ödemesi</span>
                      {calculations.partnerResults.map(p => (
                         <div key={p.id} className="flex justify-between items-center text-sm bg-white/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-emerald-900 font-medium">{p.name}</span>
                            <span className="font-bold text-emerald-700">{formatMoney(p.earlyPayoffShare)}</span>
                         </div>
                      ))}
                   </div>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEKMELER : ÖDEMELERİM & YATIRIM ANALİZİ */}
        {/* ========================================================================= */}
        {dashboardTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             
             {/* Üst Bilgi Banner, Paylaşım ve Ortak Seçici (YENİ) */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <button 
                        onClick={() => setViewingPartnerId(myPartner.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${viewedPartner.id === myPartner.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                     >
                        <User size={16}/> Benim Analizim
                     </button>
                     <button 
                        onClick={() => setViewingPartnerId(otherPartner.id)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${viewedPartner.id === otherPartner.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                     >
                        <Users size={16}/> Ortağımın Analizi
                     </button>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-3 border-t border-slate-100 pt-3">
                    {viewedPartner.name} - Özel Yatırım Panosu
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Buradaki tüm yatırım kâr/zarar hesaplamaları sizin girdiğiniz global kurlar üzerinden yapılmaktadır.</p>
               </div>
               
               <div className="flex flex-col gap-2 min-w-[250px]">
                 {!myInvData.isShared && !myInvData.usePartnerRates && (
                    <button onClick={() => shareInvestmentRates(myPartner.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200">
                      <Share2 size={16}/> Kur Takibimi Ortağa Aktar
                    </button>
                 )}
                 {myInvData.isShared && !myInvData.usePartnerRates && (
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-200">
                      <CheckCircle2 size={16}/> Kurlarınız Ortağınızla Paylaşımda
                    </div>
                 )}
                 {otherInvData.isShared && !myInvData.usePartnerRates && (
                    <button onClick={() => acceptSharedRates(myPartner.id, otherPartner.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 shadow-sm">
                      <DownloadCloud size={16}/> Ortağınız Kurlarını Paylaştı (Eşitle)
                    </button>
                 )}
                 {myInvData.usePartnerRates && (
                    <button onClick={() => disconnectSharedRates(myPartner.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                      <X size={16}/> Eşitlemeyi İptal Et (Kendim Gireceğim)
                    </button>
                 )}
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SOL PANEL (Ödemeler & Kur Girişi) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {myInvData.usePartnerRates && (
                     <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
                        <Info size={24} className="shrink-0"/>
                        <p className="font-medium text-sm">
                           Şu an {otherPartner.name} adlı ortağınızın paylaştığı kurları kullanıyorsunuz. Kurlar otomatik olarak çekiliyor ve düzenlenemez. Kendi kurlarınızı girmek için eşitlemeyi iptal edebilirsiniz.
                        </p>
                     </div>
                  )}

                  {/* 1. PEŞİNAT */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Home size={18} className="text-indigo-600"/> 1. Peşinat Ödemesi ({viewedPartner.name})</h3>
                     <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                           <span className="text-sm font-medium text-slate-500">Eve Verilen Nakit Peşinat</span>
                           <div className="text-xl font-bold text-slate-800">{formatMoney(viewedResults.houseDp)}</div>
                        </div>
                        <div className="flex-1 flex gap-2">
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Altın Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 2000"
                                 value={activeRates.dp?.gold || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'dp', 'gold', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-amber-400 focus:ring-1 ring-amber-400 disabled:bg-slate-100"
                              />
                           </div>
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Dolar Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 30.5"
                                 value={activeRates.dp?.usd || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'dp', 'usd', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-green-500 focus:ring-1 ring-green-500 disabled:bg-slate-100"
                              />
                           </div>
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Euro Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 33.2"
                                 value={activeRates.dp?.eur || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'dp', 'eur', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 ring-blue-500 disabled:bg-slate-100"
                              />
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center text-sm font-semibold text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                        <span>O günkü değerleri:</span>
                        <div className="flex gap-4">
                           <span className="text-amber-600">{formatCurrency(calculateEquivalent(viewedResults.houseDp, activeRates.dp?.gold), 'gr')}</span>
                           <span className="text-green-600">{formatCurrency(calculateEquivalent(viewedResults.houseDp, activeRates.dp?.usd), '$')}</span>
                           <span className="text-blue-600">{formatCurrency(calculateEquivalent(viewedResults.houseDp, activeRates.dp?.eur), '€')}</span>
                        </div>
                     </div>
                  </div>

                  {/* 2. MASRAFLAR */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt size={18} className="text-indigo-600"/> 2. Tapu, Sigorta & Ek Masraflar ({viewedPartner.name})</h3>
                     <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                           <span className="text-sm font-medium text-slate-500">Çıkan Toplam Masraf (Manuel+Oto)</span>
                           <div className="text-xl font-bold text-slate-800">{formatMoney(viewedResults.totalCalculatedExpenses)}</div>
                        </div>
                        <div className="flex-1 flex gap-2">
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Altın Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 2050"
                                 value={activeRates.exp?.gold || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'exp', 'gold', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-amber-400 focus:ring-1 ring-amber-400 disabled:bg-slate-100"
                              />
                           </div>
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Dolar Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 31.0"
                                 value={activeRates.exp?.usd || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'exp', 'usd', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-green-500 focus:ring-1 ring-green-500 disabled:bg-slate-100"
                              />
                           </div>
                           <div className="flex flex-col flex-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Euro Kuru</label>
                              <input 
                                 type="number" disabled={myInvData.usePartnerRates} placeholder="Örn: 34.0"
                                 value={activeRates.exp?.eur || ''} onChange={(e)=>updateInvestmentRate(myPartner.id, 'exp', 'eur', e.target.value)}
                                 className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 ring-blue-500 disabled:bg-slate-100"
                              />
                           </div>
                        </div>
                     </div>
                     <div className="flex justify-between items-center text-sm font-semibold text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                        <span>O günkü değerleri:</span>
                        <div className="flex gap-4">
                           <span className="text-amber-600">{formatCurrency(calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.gold), 'gr')}</span>
                           <span className="text-green-600">{formatCurrency(calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.usd), '$')}</span>
                           <span className="text-blue-600">{formatCurrency(calculateEquivalent(viewedResults.totalCalculatedExpenses, activeRates.exp?.eur), '€')}</span>
                        </div>
                     </div>
                  </div>

                  {/* 3. ÖDENEN TAKSİTLER */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><CalendarClock size={18} className="text-indigo-600"/> 3. Ödenen Taksitler ({viewedPartner.name})</h3>
                     <p className="text-xs text-slate-500 mb-4">"Genel Durum" sekmesinde ödediğinizi işaretlediğiniz aylar burada listelenir.</p>

                     {paidMonths.length === 0 ? (
                        <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                           Henüz ödenmiş bir taksit bulunmuyor.
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {paidMonths.sort((a,b)=>a-b).map(month => {
                              const amt = viewedResults.monthlyContribution;
                              const mRates = activeRates.months?.[String(month)] || {};
                              
                              return (
                              <div key={month} className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                 <div className="w-full sm:w-1/3">
                                    <span className="text-sm font-bold text-slate-700">{month}. Taksit</span>
                                    <span className="text-xs text-slate-500 block">{getMonthDateLabel(property.startDate, month)}</span>
                                    <div className="text-base font-black text-indigo-700 mt-1">{formatMoney(amt)}</div>
                                 </div>
                                 <div className="flex-1 flex gap-2 w-full">
                                    <div className="flex flex-col flex-1">
                                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Altın</label>
                                       <input 
                                          type="number" disabled={myInvData.usePartnerRates} 
                                          value={mRates.gold || ''} onChange={(e)=>updateInvestmentMonthRate(myPartner.id, month, 'gold', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-amber-400 focus:ring-1 ring-amber-400 disabled:bg-slate-100"
                                       />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Dolar</label>
                                       <input 
                                          type="number" disabled={myInvData.usePartnerRates} 
                                          value={mRates.usd || ''} onChange={(e)=>updateInvestmentMonthRate(myPartner.id, month, 'usd', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-green-500 focus:ring-1 ring-green-500 disabled:bg-slate-100"
                                       />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 pl-1">Euro</label>
                                       <input 
                                          type="number" disabled={myInvData.usePartnerRates} 
                                          value={mRates.eur || ''} onChange={(e)=>updateInvestmentMonthRate(myPartner.id, month, 'eur', e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 ring-blue-500 disabled:bg-slate-100"
                                       />
                                    </div>
                                 </div>
                              </div>
                           )})}
                        </div>
                     )}
                  </div>

                </div>

                {/* SAĞ PANEL (Sonuçlar ve Analiz) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Evin Güncel Değeri ve Bugünkü Kur (Finansal Veri Girişi) */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120}/></div>
                     
                     <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10"><Target size={18} className="text-indigo-400"/> Evin Mevcut Piyasa Değeri</h3>
                     <p className="text-xs text-slate-400 mb-3 relative z-10">Evin bugünkü güncel/tahmini piyasa değerini girerek doğru bir kâr analizi yapabilirsiniz.</p>
                     
                     <div className="relative z-10 mb-6 pb-6 border-b border-slate-700">
                        <input 
                           type="number" 
                           value={property.currentValue || ''} 
                           onChange={(e) => updateProperty('currentValue', Number(e.target.value))}
                           className="w-full p-3 text-xl bg-slate-800 border border-slate-600 rounded-lg outline-none focus:border-indigo-400 text-white font-bold"
                        />
                     </div>

                     <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10"><TrendingUp size={18} className="text-emerald-400"/> Bugünkü Güncel Kurlar</h3>
                     
                     <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                           <span className="w-16 font-medium text-amber-400 text-sm">Altın:</span>
                           <input type="number" value={currentRates.gold || ''} onChange={e=>updateCurrentRates('gold', e.target.value)} placeholder="0.00" className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded outline-none focus:border-amber-400 text-white"/>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="w-16 font-medium text-green-400 text-sm">Dolar:</span>
                           <input type="number" value={currentRates.usd || ''} onChange={e=>updateCurrentRates('usd', e.target.value)} placeholder="0.00" className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded outline-none focus:border-green-400 text-white"/>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="w-16 font-medium text-blue-400 text-sm">Euro:</span>
                           <input type="number" value={currentRates.eur || ''} onChange={e=>updateCurrentRates('eur', e.target.value)} placeholder="0.00" className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded outline-none focus:border-blue-400 text-white"/>
                        </div>
                     </div>
                  </div>

                  {/* Yatırım Analizi (YENİ MODEL) */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><LineChart size={120}/></div>
                     <h3 className="text-lg font-bold text-slate-800 mb-1 relative z-10">Yatırım Özeti ({viewedPartner.name})</h3>
                     <p className="text-[11px] text-slate-500 mb-6 relative z-10 leading-relaxed">
                        Bugüne kadar cepten çıkan para hesaplanıp, evin bugünkü değerinden "kalan banka borcu" düşülerek gerçek bir "Net Kâr" analizi yapılmıştır.
                     </p>

                     <div className="space-y-5 relative z-10">
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-600 font-medium">Güncel Ev Değerinden Payı ({viewedResults.targetShare}%):</span>
                              <span className="font-bold text-slate-800">{formatMoney(grossHouseShareValue)}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                              <span className="text-red-500 font-medium">Banka Kalan Kredi Borcu:</span>
                              <span className="font-bold text-red-600">-{formatMoney(viewedResults.remainingLoanDebt)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-indigo-900">Evden Gelen NET Varlık:</span>
                              <span className="text-lg font-black text-indigo-700">{formatMoney(netHouseWealth)}</span>
                           </div>
                        </div>

                        <div>
                           <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Şimdiye Kadar Çıkan Toplam Nakit:</span>
                           <div className="text-xl font-bold text-slate-600">{formatMoney(viewedResults.totalPaidOutHistory)}</div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                           {/* ALTIN */}
                           <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm font-bold text-amber-800 flex items-center gap-1"><Coins size={14}/> Biriken Toplam Altın</span>
                                 <span className="font-bold text-amber-600">{formatCurrency(totalInvValue.gold, 'gr')}</span>
                              </div>
                              {currentRates.gold && totalInvValue.gold > 0 && (
                                 <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-amber-200/50">
                                    <span className="text-slate-500">Bugünkü Kâr/Zarar Değeri:</span>
                                    <span className={`font-bold ${((netHouseWealth) - (totalInvValue.gold * currentRates.gold)) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {formatMoney((netHouseWealth) - (totalInvValue.gold * currentRates.gold))}
                                    </span>
                                 </div>
                              )}
                           </div>

                           {/* DOLAR */}
                           <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm font-bold text-green-800 flex items-center gap-1"><Coins size={14}/> Biriken Toplam Dolar</span>
                                 <span className="font-bold text-green-600">{formatCurrency(totalInvValue.usd, '$')}</span>
                              </div>
                              {currentRates.usd && totalInvValue.usd > 0 && (
                                 <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-green-200/50">
                                    <span className="text-slate-500">Bugünkü Kâr/Zarar Değeri:</span>
                                    <span className={`font-bold ${((netHouseWealth) - (totalInvValue.usd * currentRates.usd)) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {formatMoney((netHouseWealth) - (totalInvValue.usd * currentRates.usd))}
                                    </span>
                                 </div>
                              )}
                           </div>

                           {/* EURO */}
                           <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm font-bold text-blue-800 flex items-center gap-1"><Coins size={14}/> Biriken Toplam Euro</span>
                                 <span className="font-bold text-blue-600">{formatCurrency(totalInvValue.eur, '€')}</span>
                              </div>
                              {currentRates.eur && totalInvValue.eur > 0 && (
                                 <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-blue-200/50">
                                    <span className="text-slate-500">Bugünkü Kâr/Zarar Değeri:</span>
                                    <span className={`font-bold ${((netHouseWealth) - (totalInvValue.eur * currentRates.eur)) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {formatMoney((netHouseWealth) - (totalInvValue.eur * currentRates.eur))}
                                    </span>
                                 </div>
                              )}
                           </div>

                        </div>
                     </div>
                  </div>

                </div>
             </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEKMELER : AYRILIK & DEĞERLEME (VALUATION) */}
        {/* ========================================================================= */}
        {dashboardTab === 'valuation' && (
           <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 opacity-5"><Scale size={200}/></div>
                 <div className="max-w-3xl relative z-10">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Ortaklıktan Ayrılma ve Değerleme Panosu</h2>
                    <p className="text-slate-500 leading-relaxed mb-6">
                       Aşağıdaki tabloya evin/kredinin alındığı günkü göstergeleri ve bugünkü güncel değerleri girerek "Hesapla" tuşuna basın. Sistem size her bir endekse göre olası ayrılık bedellerini kıyaslayarak sunacaktır.
                    </p>
                    
                    <div className="flex items-center gap-3">
                       <span className="font-bold text-slate-700">Hangi Ortağın Ayrılma Senaryosu:</span>
                       <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button onClick={() => setViewingPartnerId(myPartner.id)} className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${viewedPartner.id === myPartner.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                             {myPartner.name}
                          </button>
                          <button onClick={() => setViewingPartnerId(otherPartner.id)} className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${viewedPartner.id === otherPartner.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                             {otherPartner.name}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* GİRİŞ FORMU TABLOSU */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600"/> Karşılaştırma Endekslerini Girin</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                       <thead>
                          <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                             <th className="p-3 font-bold w-1/3">Ekonomik Gösterge / Skala</th>
                             <th className="p-3 font-bold text-indigo-600">Kredi Çekilirken (Eski)</th>
                             <th className="p-3 font-bold text-emerald-600">Ayrılırken (Bugün)</th>
                             <th className="p-3 font-bold text-center w-16"></th>
                          </tr>
                       </thead>
                       <tbody>
                          {Object.entries(valuationScenarios).map(([key, data]) => (
                             <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-700">{data.name}</td>
                                <td className="p-3"><input type="number" placeholder="0" value={data.initial} onChange={e=>updateScenario(key, 'initial', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white"/></td>
                                <td className="p-3"><input type="number" placeholder="0" value={data.current} onChange={e=>updateScenario(key, 'current', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-emerald-400 bg-white"/></td>
                                <td className="p-3 text-center"></td>
                             </tr>
                          ))}
                          {customValuations.map(custom => (
                             <tr key={custom.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="p-3"><input type="text" placeholder="Örn: Memur Maaşı" value={custom.name} onChange={e=>updateCustomValuation(custom.id, 'name', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white font-semibold text-slate-700"/></td>
                                <td className="p-3"><input type="number" placeholder="0" value={custom.initial} onChange={e=>updateCustomValuation(custom.id, 'initial', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-indigo-400 bg-white"/></td>
                                <td className="p-3"><input type="number" placeholder="0" value={custom.current} onChange={e=>updateCustomValuation(custom.id, 'current', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-emerald-400 bg-white"/></td>
                                <td className="p-3 text-center"><button onClick={()=>removeCustomValuation(custom.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 
                 <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-100 pt-6">
                    <button onClick={addCustomValuation} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                       <Plus size={16}/> Yeni Endeks Ekle
                    </button>
                    <button onClick={() => setShowValuationResults(true)} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-lg transform hover:scale-105 transition-all">
                      HESAPLA VE KARŞILAŞTIR <ArrowRight size={20}/>
                    </button>
                 </div>
              </div>

              {/* SONUÇLAR VE KARTLAR */}
              {showValuationResults && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-200 flex items-start sm:items-center gap-4">
                       <div className="bg-emerald-100 p-2 rounded-full shrink-0"><Info size={24} className="text-emerald-600"/></div>
                       <div className="text-sm leading-relaxed">
                          Aşağıdaki kartlarda <strong>{viewedPartner.name}</strong> adlı ortağın ayrılık bedelleri hesaplanmıştır. Evin orijinal değeri girdiğiniz skalaya göre oranlanarak büyütülmüş, ardından bankaya kalan güncel borç düşülüp ortağın %{viewedResults.targetShare} payı netleştirilmiştir.
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                       {Object.entries(valuationScenarios).map(([key, data]) => {
                          if(!data.initial || !data.current) return null;
                          const mult = Number(data.current) / Number(data.initial);
                          const estHouseVal = property.price * mult; // Evin rayiç/büyümüş değeri
                          const estBuyoutVal = (estHouseVal * (viewedResults.targetShare / 100)) - viewedResults.remainingLoanDebt;
                          const indexedPaid = viewedResults.totalPaidOutHistory * mult; // Bugüne kadar ödediğinin enflasyonlu değeri
                          
                          return (
                             <div key={key} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-300 transition-all hover:shadow-md">
                                <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                   {data.name}
                                   <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">x{mult.toFixed(2)}</span>
                                </h4>
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Bugüne Kadar Verdiklerinin Karşılığı:</span>
                                      <span className="font-bold text-slate-700">{formatMoney(indexedPaid)}</span>
                                   </div>
                                   <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Evin Ulaşmış Olması Gereken Değer:</span>
                                      <span className="font-bold text-slate-700">{formatMoney(estHouseVal)}</span>
                                   </div>
                                   <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-4 relative overflow-hidden">
                                      <div className="absolute right-0 bottom-0 opacity-10 -mr-2 -mb-2"><Scale size={60}/></div>
                                      <span className="block text-[11px] font-black uppercase text-indigo-600 mb-1 relative z-10">Adil Ayrılma / Devir Bedeli</span>
                                      <div className={`text-2xl font-black relative z-10 ${estBuyoutVal > 0 ? 'text-indigo-900' : 'text-slate-400'}`}>
                                         {estBuyoutVal > 0 ? formatMoney(estBuyoutVal) : 'Borçlu Durumda'}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          );
                       })}

                       {customValuations.map(custom => {
                          if(!custom.initial || !custom.current) return null;
                          const mult = Number(custom.current) / Number(custom.initial);
                          const estHouseVal = property.price * mult;
                          const estBuyoutVal = (estHouseVal * (viewedResults.targetShare / 100)) - viewedResults.remainingLoanDebt;
                          const indexedPaid = viewedResults.totalPaidOutHistory * mult;
                          
                          return (
                             <div key={custom.id} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-300 transition-all hover:shadow-md">
                                <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                   {custom.name}
                                   <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">x{mult.toFixed(2)}</span>
                                </h4>
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Bugüne Kadar Verdiklerinin Karşılığı:</span>
                                      <span className="font-bold text-slate-700">{formatMoney(indexedPaid)}</span>
                                   </div>
                                   <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Evin Ulaşmış Olması Gereken Değer:</span>
                                      <span className="font-bold text-slate-700">{formatMoney(estHouseVal)}</span>
                                   </div>
                                   <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-4 relative overflow-hidden">
                                      <div className="absolute right-0 bottom-0 opacity-10 -mr-2 -mb-2"><Scale size={60}/></div>
                                      <span className="block text-[11px] font-black uppercase text-indigo-600 mb-1 relative z-10">Adil Ayrılma / Devir Bedeli</span>
                                      <div className={`text-2xl font-black relative z-10 ${estBuyoutVal > 0 ? 'text-indigo-900' : 'text-slate-400'}`}>
                                         {estBuyoutVal > 0 ? formatMoney(estBuyoutVal) : 'Borçlu Durumda'}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
