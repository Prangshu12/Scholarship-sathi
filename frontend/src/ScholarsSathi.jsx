import { useState, useMemo, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Search,
  Bell,
  Bookmark,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  User,
  UserPlus,
  UserCheck,
  IndianRupee,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  Menu,
  X,
  RefreshCw,
  Compass,
  Plug,
  Cpu,
  Server,
  Bot,
  Globe,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Building2,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';

// ============================================================================
// 1. API INTEGRATION CONFIGURATION LAYER (BACKEND & ML MODEL API ENDPOINTS)
// ============================================================================
const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const DEFAULT_API_CONFIG = {
  BACKEND_BASE_URL: `${API_HOST}/api`,
  ML_API_BASE_URL: `${API_HOST}/ml`,
  USE_MOCK_FALLBACK: true,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    UPDATE_PROFILE: '/student/profile',
    GET_SCHOLARSHIPS: '/scholarships',
    UPDATE_STATUS: '/applications/status',
    ML_PREDICT_BATCH: '/predict-eligibility',
    ML_EXPLAIN_SINGLE: '/explain-match'
  }
};

// ============================================================================
// 2. REFERENCE CONSTANTS & SCHOLARSHIP DATASET
// ============================================================================
const INDIAN_STATES = [
  'Assam',
  'All India',
  'Maharashtra',
  'Karnataka',
  'Delhi',
  'West Bengal'
];

const INTERNATIONAL_REGIONS = [
  'Outside India (SAARC / Asia)',
  'Outside India (Africa)',
  'Outside India (Middle East)',
  'Outside India (Europe / Americas)',
  'Outside India (Global / Other)'
];

const INDIAN_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'];

const COURSES = [
  'Class 11-12',
  'Undergraduate (B.Tech / B.E.)',
  'Undergraduate (General / B.Sc / B.Com)',
  'Postgraduate',
  'PhD / Research'
];

const PRACTICAL_CHECKLIST = [
  {
    id: 'npci',
    title: 'Aadhaar-Bank NPCI DBT Seeding Active',
    desc: 'Verify on UIDAI / Bank app so Direct Benefit Transfer does not bounce.'
  },
  {
    id: 'income',
    title: 'Valid Financial Year Income Certificate',
    desc: 'Issued by Circle Officer / Tehsildar within the last 6–12 months.'
  },
  {
    id: 'caste',
    title: 'Category / OBC-NCL / EWS / Passport ID',
    desc: 'Digital certificate with valid barcode/serial number (or Passport for International).'
  },
  {
    id: 'bonafide',
    title: 'Current Year Bonafide & Fee Receipt',
    desc: 'Signed and stamped by your college/university registrar.'
  },
  {
    id: 'digilocker',
    title: 'DigiLocker / Transcript Marksheets Ready',
    desc: 'Class 10, Class 12, and latest semester marksheets synced.'
  }
];

const DEFAULT_SCHOLARSHIPS = [
  {
    id: 1,
    title: 'Post-Matric Scholarship for OBC Students (Assam)',
    provider: 'State Govt',
    ministry: 'Directorate of Welfare of OBC, Govt. of Assam',
    amount: 25000,
    deadlineDays: 9,
    deadlineDate: '26 Nov 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['OBC'],
    maxIncome: 250000,
    allowedStates: ['Assam'],
    minMarks: 50,
    allowedCourses: [
      'Class 11-12',
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)',
      'Postgraduate'
    ],
    applyUrl: 'https://scholarships.gov.in/',
    documents: [
      'Assam Domicile / PRC',
      'OBC Non-Creamy Layer Certificate',
      'Annual Family Income Certificate (< ₹2.5L)',
      'Previous Year Marksheet',
      'NPCI Seeded Bank Passbook'
    ]
  },
  {
    id: 2,
    title: 'AICTE Pragati / Saksham Technical Degree Scholarship',
    provider: 'Central Govt',
    ministry: 'All India Council for Technical Education (AICTE)',
    amount: 50000,
    deadlineDays: 14,
    deadlineDate: '01 Dec 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
    maxIncome: 800000,
    allowedStates: ['All India'],
    minMarks: 60,
    allowedCourses: ['Undergraduate (B.Tech / B.E.)'],
    applyUrl: 'https://scholarships.gov.in/',
    documents: [
      '10th & 12th Marksheets',
      'B.Tech Admission Allotment Letter',
      'Family Income Certificate (< ₹8L)',
      'Aadhaar Card & Bank Details'
    ]
  },
  {
    id: 3,
    title: 'Reliance Foundation Undergraduate Scholarship',
    provider: 'Corporate CSR',
    ministry: 'Reliance Foundation',
    amount: 200000,
    deadlineDays: 22,
    deadlineDate: '09 Dec 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
    maxIncome: 1500000,
    allowedStates: ['All India'],
    minMarks: 60,
    allowedCourses: [
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)'
    ],
    applyUrl: 'https://www.scholarships.reliancefoundation.org/',
    documents: [
      'Class 12 Marksheet',
      'Current College Bonafide',
      'Income Proof (< ₹2.5L preferred)',
      'Online Aptitude Test Score'
    ]
  },
  {
    id: 4,
    title: 'Ishan Uday Special Scholarship for North Eastern Region',
    provider: 'Central Govt',
    ministry: 'University Grants Commission (UGC)',
    amount: 78000,
    deadlineDays: 11,
    deadlineDate: '28 Nov 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
    maxIncome: 450000,
    allowedStates: ['Assam'],
    minMarks: 60,
    allowedCourses: [
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)'
    ],
    applyUrl: 'https://scholarships.gov.in/',
    documents: [
      'NER Domicile Certificate',
      'Class 12 Passing Certificate',
      'Income Certificate (< ₹4.5L)',
      'First Year Enrollment Proof'
    ]
  },
  {
    id: 5,
    title: "HDFC Bank Parivartan's ECSS Programme",
    provider: 'Corporate CSR',
    ministry: 'HDFC Bank CSR Initiative',
    amount: 75000,
    deadlineDays: 19,
    deadlineDate: '06 Dec 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
    maxIncome: 250000,
    allowedStates: ['All India'],
    minMarks: 55,
    allowedCourses: [
      'Class 11-12',
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)',
      'Postgraduate'
    ],
    applyUrl: 'https://www.buddy4study.com/page/hdfc-bank-parivartans-ecss-programme',
    documents: [
      'Passport Photo & ID',
      'Previous Year Marksheet (min 55%)',
      'Fee Receipt',
      'Family Income Proof (< ₹2.5L)'
    ]
  },
  {
    id: 6,
    title: 'Central Sector Scheme of Scholarships for College Students',
    provider: 'Central Govt',
    ministry: 'Department of Higher Education, Govt. of India',
    amount: 20000,
    deadlineDays: 28,
    deadlineDate: '15 Dec 2026',
    allowedNationalities: ['Indian'],
    allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'],
    maxIncome: 450000,
    allowedStates: ['All India'],
    minMarks: 80,
    allowedCourses: [
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)',
      'Postgraduate'
    ],
    applyUrl: 'https://scholarships.gov.in/',
    documents: [
      'Class 12 Marksheet (Top 20 percentile / ≥80%)',
      'Income Certificate (< ₹4.5L)',
      'Bank Passbook',
      'College Verification'
    ]
  },
  {
    id: 7,
    title: 'ICCR Atal Bihari Vajpayee General Scholarship Scheme (International)',
    provider: 'International',
    ministry: 'Indian Council for Cultural Relations (ICCR), MEA',
    amount: 180000,
    deadlineDays: 12,
    deadlineDate: '29 Nov 2026',
    allowedNationalities: ['International'],
    allowedCategories: ['International'],
    maxIncome: 2500000,
    allowedStates: ['Outside India'],
    minMarks: 60,
    allowedCourses: [
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)',
      'Postgraduate',
      'PhD / Research'
    ],
    applyUrl: 'https://a2ascholarships.iccr.gov.in/',
    documents: [
      'Valid Foreign Passport',
      'Academic Transcripts & Equivalence Certificate',
      'English Proficiency Proof',
      'Medical Fitness Certificate'
    ]
  },
  {
    id: 8,
    title: 'Study in India (SII) Global Merit Scholarship',
    provider: 'International',
    ministry: 'Ministry of Education, Govt. of India (Global)',
    amount: 240000,
    deadlineDays: 24,
    deadlineDate: '11 Dec 2026',
    allowedNationalities: ['International'],
    allowedCategories: ['International'],
    maxIncome: 3000000,
    allowedStates: ['Outside India'],
    minMarks: 65,
    allowedCourses: [
      'Undergraduate (B.Tech / B.E.)',
      'Undergraduate (General / B.Sc / B.Com)',
      'Postgraduate'
    ],
    applyUrl: 'https://www.studyinindia.gov.in/',
    documents: [
      'Passport Copy',
      'High School / Bachelor Transcripts',
      'Statement of Purpose (SOP)',
      'SII Registration ID'
    ]
  }
];

// ============================================================================
// 3. LOCAL ELIGIBILITY & AI EXPLANATION FALLBACK ENGINE
// ============================================================================
function localRuleFallbackEngine(student, sch) {
  const isIndian = (student.nationality || 'Indian') === 'Indian';
  const natPass = sch.allowedNationalities.includes(student.nationality || 'Indian');

  const criteriaBreakdown = [];

  // 1. Citizenship / Residency
  criteriaBreakdown.push({
    label: 'Residency / Citizenship',
    passed: natPass,
    detail: `Required: ${sch.allowedNationalities.join(', ')} | Yours: ${
      isIndian ? 'Indian Citizen' : 'International / Outside India'
    }`
  });

  // 2. Social Category (Strictly evaluated ONLY when student is an Indian Citizen)
  if (isIndian) {
    const catPass = sch.allowedCategories.includes(student.category);
    criteriaBreakdown.push({
      label: 'Social Category',
      passed: catPass,
      detail: `Required: ${
        sch.allowedCategories.length >= 6 ? 'All Categories' : sch.allowedCategories.join(', ')
      } | Yours: ${student.category}`
    });
  }

  // 3. Annual Family Income Ceiling
  const incPass = Number(student.income) <= sch.maxIncome;
  criteriaBreakdown.push({
    label: 'Family Income Ceiling',
    passed: incPass,
    detail: `Max: ₹${sch.maxIncome.toLocaleString('en-IN')} | Yours: ₹${Number(
      student.income
    ).toLocaleString('en-IN')}`
  });

  // 4. Geographic / State Domicile
  const statePass = isIndian
    ? sch.allowedStates.includes('All India') || sch.allowedStates.includes(student.state)
    : sch.allowedStates.includes('Outside India');
  criteriaBreakdown.push({
    label: isIndian ? 'State Domicile' : 'Geographic Eligibility',
    passed: statePass,
    detail: `Eligible: ${sch.allowedStates.join(', ')} | Yours: ${student.state}`
  });

  // 5. Academic Merit Cutoff
  const marksPass = Number(student.marks) >= sch.minMarks;
  criteriaBreakdown.push({
    label: 'Academic Merit Cutoff',
    passed: marksPass,
    detail: `Min: ${sch.minMarks}% | Yours: ${student.marks}%`
  });

  // 6. Course Level
  const coursePass = sch.allowedCourses.includes(student.course);
  criteriaBreakdown.push({
    label: 'Course Level',
    passed: coursePass,
    detail: `Yours: ${student.course}`
  });

  const totalCount = criteriaBreakdown.length;
  const passedCount = criteriaBreakdown.filter((c) => c.passed).length;
  const matchScore = Math.round((passedCount / totalCount) * 100);

  let status = 'NOT_ELIGIBLE';
  if (passedCount === totalCount && natPass) {
    status = 'ELIGIBLE';
  } else if (passedCount >= totalCount - 2 && natPass) {
    status = 'PARTIAL';
  }

  const failedLabels = criteriaBreakdown.filter((c) => !c.passed).map((c) => c.label);
  const aiReason =
    status === 'ELIGIBLE'
      ? isIndian
        ? `Strong match! Your ${student.marks}% academic score, ${student.category} category, and ₹${Number(
            student.income
          ).toLocaleString('en-IN')} family income satisfy all criteria for ${sch.title}.`
        : `Strong international match! As an international applicant with ${student.marks}% marks, you meet 100% of the global eligibility criteria for ${sch.title} (Indian caste/category criteria waived).`
      : status === 'PARTIAL'
      ? `You meet ${passedCount} of ${totalCount} requirements, but need attention on: ${failedLabels.join(
          ', '
        )}.`
      : `Currently ineligible due to mismatch in ${failedLabels.join(' & ')}.`;

  return { matchScore, status, aiReason, criteriaBreakdown };
}

// ============================================================================
// 4. UI SOUND EFFECTS SYNTHESIZER ENGINE (Web Audio API - Zero External Files)
// ============================================================================
class UiSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastClickTime = 0;
    this.lastSpecialSoundTime = 0;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Universal subtle, tactile click for EVERY clickable element
  playSubtleClick() {
    if (!this.enabled) return;
    const now = Date.now();
    // Suppress subtle click if special sound was just triggered
    if (now - this.lastSpecialSoundTime < 300) return;
    // Debounce rapid nested triggers
    if (now - this.lastClickTime < 35) return;
    this.lastClickTime = now;

    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Soft, warm, luxurious tactile micro-pop (580Hz -> 160Hz over 22ms)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.022);

      gain.gain.setValueAtTime(0.032, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch {
      // AudioContext policy or unsupported browser - fail silently
    }
  }

  // Dedicated Special Sound Effect for AI ML Matching & Evaluation
  playSpecial() {
    if (!this.enabled) return;
    this.lastSpecialSoundTime = Date.now();

    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Prestigious 4-note ascending academic fanfare (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const noteTime = t + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.06, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.18);
      });
    } catch {
      // AudioContext policy or unsupported browser - fail silently
    }
  }

  play(type) {
    if (!this.enabled) return;
    if (type === 'special' || type === 'success') {
      this.playSpecial();
    } else {
      this.playSubtleClick();
    }
  }
}

const soundFx = new UiSoundEngine();

// ============================================================================
// 5. MAIN SCHOLARS SATHI REACT APPLICATION
// ============================================================================
export default function ScholarsSathi() {
  // Theme State: Dark Mode (Requirement 1)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sync theme with HTML class
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ss_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ss_theme', 'light');
      }
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    soundFx.play('toggle');
  };

  // Sound Effects State (Mute / Unmute Toggle)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_sound');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    soundFx.enabled = soundEnabled;
    try {
      localStorage.setItem('ss_sound', soundEnabled ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) soundFx.play('toggle');
  };

  // View & Responsive Navigation State
  const [activeView, setActiveView] = useState('home'); // 'home' | 'dashboard'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-hide navigation on scroll-down, reveal on scroll-up or top hover
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 25) {
        // At the top of the page: always visible
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY.current - 8) {
        // Scrolling up: reveal navbar
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down: hide navbar
        setIsHeaderVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showNavbar = isHeaderVisible || isHovered;

  // Global Click Event Listener: Guarantees every clickable element produces the subtle sound consistently
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!soundFx.enabled) return;
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      // Check if this click was on a special AI/ML action
      const specialEl = target.closest('[data-sound="special"]');
      if (specialEl) {
        soundFx.playSpecial();
        return;
      }

      // Check if clicked element or any parent is clickable/interactive
      const clickable = target.closest(
        'button, a, select, textarea, input, label, [role="button"], [role="tab"], [role="checkbox"], .cursor-pointer'
      );

      if (clickable) {
        soundFx.playSubtleClick();
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  // API Configuration State (Backend + ML Model Service)
  const [apiConfig, setApiConfig] = useState(() => {
    try {
      const savedBackend = localStorage.getItem('ss_backend_url');
      const savedMl = localStorage.getItem('ss_ml_url');
      return {
        ...DEFAULT_API_CONFIG,
        BACKEND_BASE_URL: savedBackend || DEFAULT_API_CONFIG.BACKEND_BASE_URL,
        ML_API_BASE_URL: savedMl || DEFAULT_API_CONFIG.ML_API_BASE_URL
      };
    } catch {
      return DEFAULT_API_CONFIG;
    }
  });

  const [apiStatus, setApiStatus] = useState({
    label: 'Local Engine (ML Ready)',
    color: 'amber'
  });

  // Student Profile State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ss_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback to default profile on storage error
    }
    return {
      name: 'Guest Student',
      email: '',
      isAuthenticated: false,
      nationality: 'Indian', // 'Indian' | 'International'
      category: 'OBC',
      income: 220000,
      state: 'Assam',
      course: 'Undergraduate (B.Tech / B.E.)',
      marks: 84.5
    };
  });

  // Hero Instant Eligibility Checker State
  const [quickCheck, setQuickCheck] = useState({
    nationality: currentUser.nationality || 'Indian',
    category: currentUser.category || 'OBC',
    state: currentUser.state || 'Assam',
    income: currentUser.income || 220000,
    marks: currentUser.marks || 84,
    course: currentUser.course || 'Undergraduate (B.Tech / B.E.)'
  });

  // Evaluated Scholarships State
  const [enrichedScholarships, setEnrichedScholarships] = useState([]);
  const [isLoadingML, setIsLoadingML] = useState(false);

  // Saved / Applied Application Status Tracker
  const [trackedApplications, setTrackedApplications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ss_tracked')) || {};
    } catch {
      return {};
    }
  });

  // Practical Document Readiness Checklist State
  const [checklistState, setChecklistState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ss_checklist')) || { npci: true, digilocker: true };
    } catch {
      return { npci: true, digilocker: true };
    }
  });

  // Dashboard Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [categoryQuickFilter, setCategoryQuickFilter] = useState('ALL'); // 'ALL' | 'Central Govt' | 'State Govt' | 'Corporate CSR' | 'International' | 'CLOSING_SOON' | 'HIGH_VALUE'
  const [sortBy, setSortBy] = useState('SCORE');

  // Modal States
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [apiConfigModalOpen, setApiConfigModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({
    open: false,
    scholarship: null,
    mlDetail: null,
    loading: false
  });

  // Auth Form States
  const [loginForm, setLoginForm] = useState({
    email: 'rohan.das@student.edu.in',
    password: 'student123'
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    nationality: 'Indian',
    category: 'OBC',
    income: 200000,
    state: 'Assam',
    marks: 82,
    course: 'Undergraduate (B.Tech / B.E.)'
  });

  // Edit Profile Modal State
  const [profileForm, setProfileForm] = useState(currentUser);

  // API Config Modal State
  const [cfgForm, setCfgForm] = useState({
    backendUrl: apiConfig.BACKEND_BASE_URL,
    mlUrl: apiConfig.ML_API_BASE_URL
  });

  // Sync student profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ss_user', JSON.stringify(currentUser));
    } catch {
      // Ignore storage quota errors
    }
  }, [currentUser]);

  // Unified HTTP Client with Timeout & JWT Bearer Token Support
  const apiRequest = async (baseUrl, endpoint, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('scholars_sathi_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Ignore storage read error
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ok: true, data: await response.json() };
    } catch {
      clearTimeout(timeoutId);
      return { ok: false };
    }
  };

  // Load Scholarships from Backend & Run Batch ML Eligibility Evaluation
  const refreshAllData = async (targetUser = currentUser, activeCfg = apiConfig) => {
    setIsLoadingML(true);
    const schRes = await apiRequest(
      activeCfg.BACKEND_BASE_URL,
      activeCfg.ENDPOINTS.GET_SCHOLARSHIPS,
      'GET'
    );
    const rawScholarships =
      schRes.ok && Array.isArray(schRes.data) ? schRes.data : DEFAULT_SCHOLARSHIPS;

    const mlRes = await apiRequest(
      activeCfg.ML_API_BASE_URL,
      activeCfg.ENDPOINTS.ML_PREDICT_BATCH,
      'POST',
      { student: targetUser, scholarships: rawScholarships }
    );

    if (mlRes.ok && mlRes.data && Array.isArray(mlRes.data.predictions)) {
      setApiStatus({ label: 'ML Model API Connected', color: 'emerald' });
      const merged = rawScholarships.map((sch) => {
        const pred = mlRes.data.predictions.find((p) => p.scholarshipId === sch.id);
        return {
          ...sch,
          mlResult: pred || localRuleFallbackEngine(targetUser, sch)
        };
      });
      setEnrichedScholarships(merged);
    } else {
      setApiStatus({ label: 'Local Engine (ML Ready)', color: 'amber' });
      const merged = rawScholarships.map((sch) => ({
        ...sch,
        mlResult: localRuleFallbackEngine(targetUser, sch)
      }));
      setEnrichedScholarships(merged);
    }
    setIsLoadingML(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAllData(currentUser, apiConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // HANDLERS: INSTANT ELIGIBILITY CHECK (INDIAN VS OUTSIDE INDIA)
  // ==========================================================================
  const handleQuickNationalityChange = (newNat) => {
    setQuickCheck((prev) => ({
      ...prev,
      nationality: newNat,
      category: newNat === 'Indian' ? 'OBC' : 'International',
      state: newNat === 'Indian' ? 'Assam' : 'Outside India (SAARC / Asia)'
    }));
  };

  const handleQuickCheckSubmit = (e) => {
    e.preventDefault();
    const isIndian = quickCheck.nationality === 'Indian';
    const updatedUser = {
      ...currentUser,
      nationality: quickCheck.nationality,
      category: isIndian ? quickCheck.category : 'International',
      state: quickCheck.state,
      income: Number(quickCheck.income),
      marks: Number(quickCheck.marks),
      course: quickCheck.course
    };
    setCurrentUser(updatedUser);
    soundFx.play('success');
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshAllData(updatedUser, apiConfig);
  };

  // ==========================================================================
  // HANDLERS: LOGIN & REGISTRATION
  // ==========================================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const res = await apiRequest(
      apiConfig.BACKEND_BASE_URL,
      apiConfig.ENDPOINTS.LOGIN,
      'POST',
      loginForm
    );

    let loggedInUser;
    if (res.ok && res.data?.user) {
      if (res.data.token) localStorage.setItem('scholars_sathi_token', res.data.token);
      loggedInUser = { ...res.data.user, isAuthenticated: true };
    } else {
      const derivedName =
        loginForm.email
          .split('@')[0]
          .replace('.', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Rohan Das';
      loggedInUser = {
        ...currentUser,
        name: derivedName,
        email: loginForm.email,
        isAuthenticated: true
      };
    }

    setCurrentUser(loggedInUser);
    soundFx.play('success');
    setAuthModal({ open: false, tab: 'login' });
    setActiveView('dashboard');
    refreshAllData(loggedInUser, apiConfig);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const isIndian = registerForm.nationality === 'Indian';
    const payload = {
      ...registerForm,
      category: isIndian ? registerForm.category : 'International',
      income: Number(registerForm.income),
      marks: Number(registerForm.marks)
    };

    const res = await apiRequest(
      apiConfig.BACKEND_BASE_URL,
      apiConfig.ENDPOINTS.REGISTER,
      'POST',
      payload
    );

    let registeredUser;
    if (res.ok && res.data?.user) {
      if (res.data.token) localStorage.setItem('scholars_sathi_token', res.data.token);
      registeredUser = { ...res.data.user, isAuthenticated: true };
    } else {
      registeredUser = { ...payload, isAuthenticated: true };
    }

    setCurrentUser(registeredUser);
    soundFx.play('success');
    setAuthModal({ open: false, tab: 'login' });
    setActiveView('dashboard');
    refreshAllData(registeredUser, apiConfig);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('scholars_sathi_token');
    } catch {
      // Ignore
    }
    setCurrentUser((prev) => ({ ...prev, isAuthenticated: false }));
    soundFx.play('toggle');
    setActiveView('home');
  };

  // ==========================================================================
  // HANDLERS: PROFILE EDITOR & API CONFIGURATION
  // ==========================================================================
  const openEditProfileModal = () => {
    soundFx.play('modalOpen');
    setProfileForm({
      ...currentUser,
      nationality: currentUser.nationality || 'Indian'
    });
    setProfileModalOpen(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const isIndian = profileForm.nationality === 'Indian';
    const updated = {
      ...profileForm,
      category: isIndian ? profileForm.category : 'International',
      income: Number(profileForm.income),
      marks: Number(profileForm.marks)
    };

    await apiRequest(
      apiConfig.BACKEND_BASE_URL,
      apiConfig.ENDPOINTS.UPDATE_PROFILE,
      'PUT',
      updated
    );
    setCurrentUser(updated);
    setProfileModalOpen(false);
    refreshAllData(updated, apiConfig);
  };

  const handleSaveApiConfig = (e) => {
    e.preventDefault();
    const cleanedBackend = cfgForm.backendUrl.replace(/\/$/, '');
    const cleanedMl = cfgForm.mlUrl.replace(/\/$/, '');
    try {
      localStorage.setItem('ss_backend_url', cleanedBackend);
      localStorage.setItem('ss_ml_url', cleanedMl);
    } catch {
      // Ignore
    }

    const nextCfg = {
      ...apiConfig,
      BACKEND_BASE_URL: cleanedBackend,
      ML_API_BASE_URL: cleanedMl
    };
    setApiConfig(nextCfg);
    setApiConfigModalOpen(false);
    refreshAllData(currentUser, nextCfg);
  };

  // ==========================================================================
  // HANDLERS: SCHOLARSHIP DETAILS MODAL & APPLICATION TRACKING
  // ==========================================================================
  const openScholarshipDetail = async (sch) => {
    soundFx.play('modalOpen');
    setDetailModal({ open: true, scholarship: sch, mlDetail: null, loading: true });

    const res = await apiRequest(
      apiConfig.ML_API_BASE_URL,
      apiConfig.ENDPOINTS.ML_EXPLAIN_SINGLE,
      'POST',
      { student: currentUser, scholarship: sch }
    );

    const explanation =
      res.ok && res.data ? res.data : localRuleFallbackEngine(currentUser, sch);
    setDetailModal({ open: true, scholarship: sch, mlDetail: explanation, loading: false });
  };

  const handleStatusChange = (scholarshipId, status) => {
    soundFx.play(status ? 'success' : 'click');
    const next = { ...trackedApplications };
    if (status) next[scholarshipId] = status;
    else delete next[scholarshipId];
    setTrackedApplications(next);
    try {
      localStorage.setItem('ss_tracked', JSON.stringify(next));
    } catch {
      // Ignore
    }
    apiRequest(apiConfig.BACKEND_BASE_URL, apiConfig.ENDPOINTS.UPDATE_STATUS, 'POST', {
      scholarshipId,
      status
    });
  };

  const toggleChecklistItem = (id) => {
    const isNowChecked = !checklistState[id];
    soundFx.play(isNowChecked ? 'check' : 'uncheck');
    const next = { ...checklistState, [id]: isNowChecked };
    setChecklistState(next);
    try {
      localStorage.setItem('ss_checklist', JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  // ==========================================================================
  // DERIVED KPI METRICS & FILTERED SCHOLARSHIP LIST
  // ==========================================================================
  const dashboardStats = useMemo(() => {
    const eligible = enrichedScholarships.filter((s) => s.mlResult?.status === 'ELIGIBLE');
    const funding = eligible.reduce((sum, s) => sum + s.amount, 0);
    const urgent = eligible.filter((s) => s.deadlineDays <= 30).length;
    const tracked = Object.values(trackedApplications).filter(Boolean).length;
    return {
      eligibleCount: eligible.length,
      totalFunding: funding,
      urgentCount: urgent,
      trackedCount: tracked
    };
  }, [enrichedScholarships, trackedApplications]);

  const filteredScholarships = useMemo(() => {
    return enrichedScholarships
      .filter((s) => {
        // Text Search
        const matchesSearch =
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.ministry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.provider.toLowerCase().includes(searchQuery.toLowerCase());

        // Eligibility Status Dropdown Filter
        const matchesStatus =
          eligibilityFilter === 'ALL' || s.mlResult?.status === eligibilityFilter;

        // Provider Dropdown Filter
        const matchesProvider =
          providerFilter === 'ALL' || s.provider === providerFilter;

        // Quick Category Filter Bar
        let matchesQuickCategory = true;
        if (categoryQuickFilter === 'Central Govt') {
          matchesQuickCategory = s.provider === 'Central Govt';
        } else if (categoryQuickFilter === 'State Govt') {
          matchesQuickCategory = s.provider === 'State Govt';
        } else if (categoryQuickFilter === 'Corporate CSR') {
          matchesQuickCategory = s.provider === 'Corporate CSR';
        } else if (categoryQuickFilter === 'International') {
          matchesQuickCategory = s.provider === 'International';
        } else if (categoryQuickFilter === 'CLOSING_SOON') {
          matchesQuickCategory = s.deadlineDays <= 30;
        } else if (categoryQuickFilter === 'HIGH_VALUE') {
          matchesQuickCategory = s.amount >= 50000;
        }

        return matchesSearch && matchesStatus && matchesProvider && matchesQuickCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE')
          return (b.mlResult?.matchScore || 0) - (a.mlResult?.matchScore || 0);
        if (sortBy === 'DEADLINE') return a.deadlineDays - b.deadlineDays;
        if (sortBy === 'AMOUNT') return b.amount - a.amount;
        return 0;
      });
  }, [enrichedScholarships, searchQuery, eligibilityFilter, providerFilter, categoryQuickFilter, sortBy]);

  const checklistReadyCount = useMemo(
    () => PRACTICAL_CHECKLIST.filter((item) => checklistState[item.id]).length,
    [checklistState]
  );

  const resetFilters = () => {
    setSearchQuery('');
    setEligibilityFilter('ALL');
    setProviderFilter('ALL');
    setCategoryQuickFilter('ALL');
    setSortBy('SCORE');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    eligibilityFilter !== 'ALL' ||
    providerFilter !== 'ALL' ||
    categoryQuickFilter !== 'ALL' ||
    sortBy !== 'SCORE';

  // ==========================================================================
  // RENDER UI: MODERN EDTECH + GOVERNMENT-TECH MINIMALISM
  // Primary: #142B4A | Secondary: #356AE6 | Accent: #F4A340
  // Background: #F7F9FC / Dark: #0B132B | Text: #263449 / Dark: #E2E8F0
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#F8F5EF] dark:bg-[#101B2D] text-[#25282D] dark:text-[#F8F5EF] font-sans antialiased flex flex-col selection:bg-[#356AE6] selection:text-white transition-colors duration-200">
      {/* Top Edge Hover Trigger Zone (Active when navbar is hidden) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        className={`fixed top-0 inset-x-0 h-3 z-40 ${
          showNavbar ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      />

      {/* =================================================================== */}
      {/* MINIMALIST DYNAMIC AUTO-HIDE SCROLLING HOTBAR / NAVBAR              */}
      {/* Minimizes completely on scroll down, leaving only a peek notch      */}
      {/* Returns automatically when hovered back or scrolled up              */}
      {/* =================================================================== */}
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sticky top-0 z-40 w-full h-15 sm:h-16 transition-transform duration-300 ease-in-out ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        } bg-[#F8F5EF]/95 dark:bg-[#101B2D]/95 backdrop-blur-xl border-b border-[#C6A66B]/25 dark:border-[#263852] shadow-[0_2px_10px_rgba(0,0,0,0.06)]`}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4 sm:gap-6 transition-opacity duration-200 ${
            showNavbar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Brand Logo - Guaranteed single-line & resilient */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFx.play('nav');
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
            >
              <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-[#101B2D] dark:bg-[#1F304A] border border-[#C6A66B]/40 flex items-center justify-center text-white shadow-xs group-hover:bg-[#642D42] dark:group-hover:bg-[#642D42] transition-all duration-200">
                <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#C6A66B] group-hover:text-[#F8F5EF] transition-colors" />
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#101B2D] dark:text-[#F8F5EF]">
                  Scholarship <span className="text-[#642D42] dark:text-[#C6A66B] italic font-normal">Sathi</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C6A66B]/15 text-[#8A6D3B] dark:text-[#C6A66B] border border-[#C6A66B]/30 text-[9px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C6A66B]"></span>
                  Gov-Tech
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links - Spaced, clean, minimalist */}
          <nav className="hidden md:flex items-center gap-7 sm:gap-8 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                soundFx.play('nav');
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeView === 'home'
                  ? 'text-[#642D42] dark:text-[#C6A66B] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#642D42] dark:after:bg-[#C6A66B] after:rounded-full'
                  : 'text-[#647184] dark:text-[#9AA7B8] hover:text-[#101B2D] dark:hover:text-[#F8F5EF]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.play('nav');
                setActiveView('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors flex items-center gap-1.5 cursor-pointer py-1 relative ${
                activeView === 'dashboard'
                  ? 'text-[#642D42] dark:text-[#C6A66B] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#642D42] dark:after:bg-[#C6A66B] after:rounded-full'
                  : 'text-[#647184] dark:text-[#9AA7B8] hover:text-[#101B2D] dark:hover:text-[#F8F5EF]'
              }`}
            >
              <span>Scholarship Explorer</span>
              <span className="bg-[#C6A66B]/15 dark:bg-[#C6A66B]/25 text-[#D97706] dark:text-[#F4A340] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {enrichedScholarships.length || DEFAULT_SCHOLARSHIPS.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                setTimeout(() => {
                  document
                    .getElementById('practical-toolkit')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
              className="text-[#647184] dark:text-[#9AA7B8] hover:text-[#101B2D] dark:hover:text-[#F8F5EF] transition-colors cursor-pointer py-1"
            >
              DBT Checklist
            </button>
            <button
              type="button"
              onClick={() => {
                setCfgForm({
                  backendUrl: apiConfig.BACKEND_BASE_URL,
                  mlUrl: apiConfig.ML_API_BASE_URL
                });
                setApiConfigModalOpen(true);
              }}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#142B4A] dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1"
              title="Configure Backend & ML Model API URLs"
            >
              <Plug className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B]" />
              <span>API Config</span>
            </button>
          </nav>

          {/* Right Controls: Dark Mode Toggle, Auth & Profile - Neatly Aligned */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Sound Effects Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="w-9 h-9 p-2 rounded-xl border border-[#C6A66B]/25 dark:border-[#263852] bg-[#FAF7F2] dark:bg-[#172439] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1B2B47] transition-all cursor-pointer shadow-xs flex items-center justify-center"
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B]" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-9 h-9 p-2 rounded-xl border border-[#C6A66B]/25 dark:border-[#263852] bg-[#FAF7F2] dark:bg-[#172439] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1B2B47] transition-all cursor-pointer shadow-xs flex items-center justify-center"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-[#F4A340] animate-in spin-in-180" />
              ) : (
                <Moon className="w-4 h-4 text-[#142B4A]" />
              )}
            </button>

            {/* Auth Controls */}
            {currentUser.isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={openEditProfileModal}
                  className="px-3.5 py-1.5 sm:py-2 text-xs flex items-center gap-1.5 rounded-xl bg-[#642D42]/10 dark:bg-[#642D42]/20 text-[#642D42] dark:text-[#C6A66B] dark:text-blue-300 font-bold border border-[#642D42]/30 hover:bg-[#642D42]/20 transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[110px] truncate">{currentUser.name}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'login' }); })()}
                  className="px-3.5 py-2 text-xs font-bold text-[#142B4A] dark:text-slate-200 hover:text-[#642D42] dark:text-[#C6A66B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#142238] rounded-xl transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'register' }); })()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#642D42] hover:bg-[#522435] border border-[#C6A66B]/30 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142238] border border-[#C6A66B]/20 dark:border-[#263852]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Minimalist Peek Notch: ONLY this little part remains without contents when scrolling down */}
        <div
          onClick={() => setIsHovered(true)}
          className={`absolute left-1/2 -translate-x-1/2 top-full transition-all duration-300 pointer-events-auto cursor-pointer flex flex-col items-center ${
            showNavbar
              ? 'opacity-0 pointer-events-none -translate-y-1'
              : 'opacity-100 translate-y-0'
          }`}
          title="Hover or scroll up to expand navigation"
        >
          <div className="w-16 h-1.5 sm:w-20 sm:h-2 rounded-b-full bg-[#356AE6] dark:bg-[#356AE6] shadow-md hover:w-28 hover:h-2.5 hover:bg-[#C6A66B] transition-all duration-200" />
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0B132B] border-t border-[#C6A66B]/20 dark:border-[#263852] px-4 py-4 space-y-3 shadow-xl">
            <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveView('home');
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 rounded-lg flex items-center gap-2 ${
                  activeView === 'home'
                    ? 'bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B] font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-[#142238]'
                }`}
              >
                <span>Overview & Eligibility</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 rounded-lg flex items-center justify-between ${
                  activeView === 'dashboard'
                    ? 'bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B] font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-[#142238]'
                }`}
              >
                <span>Scholarship Explorer</span>
                <span className="text-[10px] font-bold bg-[#C6A66B]/20 text-[#D97706] dark:text-[#F4A340] px-2 py-0.5 rounded-full">
                  {enrichedScholarships.length} Live
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => {
                    document
                      .getElementById('practical-toolkit')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#142238]"
              >
                DBT Document Checklist
              </button>
              <button
                type="button"
                onClick={() => {
                  setCfgForm({
                    backendUrl: apiConfig.BACKEND_BASE_URL,
                    mlUrl: apiConfig.ML_API_BASE_URL
                  });
                  setApiConfigModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#142238] text-[#642D42] dark:text-[#C6A66B] flex items-center gap-2"
              >
                <Plug className="w-4 h-4" />
                <span>Backend & ML API Config</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#C6A66B]/15 dark:border-[#263852] grid grid-cols-2 gap-2">
              {currentUser.isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openEditProfileModal();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B] text-xs font-bold"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'login' }); })();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl border border-slate-300 dark:border-[#1F324E] text-[#142B4A] dark:text-slate-200 text-xs font-bold"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'register' }); })();
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-[#356AE6] text-white text-xs font-bold"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* VIEW 1: HOME OVERVIEW & INSTANT ELIGIBILITY CHECKER                 */}
      {/* =================================================================== */}
      {activeView === 'home' && (
        <main className="flex-1">
          {/* HERO BANNER: Deep Navy Blue (#142B4A) + Warm Saffron Accents */}
          <section className="relative overflow-hidden bg-[#101B2D] text-[#F8F5EF] border-b border-[#C6A66B]/25">
            {/* Subtle Minimalist Grid Pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#C6A66B 1px, transparent 1px)',
                backgroundSize: '28px 28px'
              }}
            />
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#356AE6]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 lg:py-18 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center justify-between">
                {/* Leftmost Hero Copy & Mission */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-[#C6A66B] animate-pulse"></span>
                    <span className="text-[#F4A340] font-bold">Government-Tech Initiative</span>
                    <span className="text-white/40">|</span>
                    <span>AI-Driven Eligibility & DBT Verification</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                    Discover & Claim Every Scholarship You{' '}
                    <span className="text-[#F4A340]">Actually Qualify For.</span>
                  </h1>

                  <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                    Scholarship Sathi bridges students with National Scholarship Portal (NSP), State
                    welfare boards, Corporate CSR grants, and global merit schemes. Instant ML
                    scoring eliminates guesswork and ensures zero missed deadlines.
                  </p>

                  {/* Call to Actions */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('dashboard');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Explore Scholarships</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'register' }); })()}
                      className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-[#F4A340]" />
                      <span>Create Student Account</span>
                    </button>
                  </div>

                  {/* Trust Metrics Bar */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 max-w-lg">
                    <div>
                      <p className="text-2xl font-extrabold text-white">₹4.8 Cr+</p>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">Disbursed Schemes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-[#F4A340]">96.4%</p>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">ML Match Precision</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-emerald-400">100% Free</p>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">Direct Official Portals</p>
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* CLASSY REPEATING ANIMATION: AI CONDUIT & DBT VERIFICATION STREAM  */}
                {/* ================================================================= */}
                <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col items-center justify-center relative py-2 select-none pointer-events-none">
                  {/* Top Floating Badge */}
                  <div className="animate-float-slow mb-3 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md shadow-lg text-[11px] font-bold text-white tracking-wide">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>100% DBT Verified</span>
                    </div>
                  </div>

                  {/* Upper Animated Data Flow Beam */}
                  <svg className="w-48 h-6 overflow-visible mb-1" viewBox="0 0 180 24">
                    <defs>
                      <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#356AE6" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#F4A340" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#356AE6" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,12 Q 90,0 180,12" fill="none" stroke="url(#beamGrad1)" strokeWidth="2" strokeDasharray="6 6" className="animate-dash-flow" />
                    <circle cx="90" cy="6" r="3" fill="#F4A340" className="animate-ping opacity-75" />
                  </svg>

                  {/* Central Orbital Matching Core */}
                  <div className="relative w-36 h-36 flex items-center justify-center my-1">
                    {/* Outer dashed spinning ring */}
                    <div className="w-36 h-36 rounded-full border border-dashed border-[#356AE6]/40 animate-spin-slow absolute inset-0 m-auto" />
                    
                    {/* Middle reverse dotted spinning ring */}
                    <div className="w-28 h-28 rounded-full border border-dotted border-[#F4A340]/50 animate-spin-slow-reverse absolute inset-0 m-auto" />
                    
                    {/* Ambient pulsing aura */}
                    <div className="w-20 h-20 rounded-full bg-[#356AE6]/25 blur-xl animate-pulse-ring absolute inset-0 m-auto" />

                    {/* Core Shield Emblem with Subtle Pulse */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#142B4A] to-[#1E3A66] border border-[#356AE6]/70 shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-300">
                      <Sparkles className="w-7 h-7 text-[#F4A340] animate-beam-glow" />
                    </div>
                  </div>

                  {/* Lower Animated Data Flow Beam */}
                  <svg className="w-48 h-6 overflow-visible mt-1" viewBox="0 0 180 24">
                    <defs>
                      <linearGradient id="beamGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F4A340" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#356AE6" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#F4A340" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,12 Q 90,24 180,12" fill="none" stroke="url(#beamGrad2)" strokeWidth="2" strokeDasharray="6 6" className="animate-dash-flow" />
                    <circle cx="90" cy="18" r="3" fill="#356AE6" className="animate-ping opacity-75" />
                  </svg>

                  {/* Bottom Floating Badge */}
                  <div className="animate-float-reverse mt-3 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md shadow-lg text-[11px] font-bold text-white tracking-wide">
                      <Cpu className="w-3.5 h-3.5 text-[#F4A340] shrink-0" />
                      <span>Live AI Matching Engine</span>
                    </div>
                  </div>
                </div>

                {/* Rightmost Hero Card: Instant Eligibility Check */}
                <div className="lg:col-span-4 xl:col-span-4 w-full flex justify-end">
                  <div className="w-full max-w-md ml-auto bg-white dark:bg-[#172439] text-[#25282D] dark:text-[#F8F5EF] rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#C6A66B]/20 dark:border-[#263852]">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#C6A66B]/15 dark:border-[#263852]">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#642D42] dark:text-[#C6A66B] uppercase tracking-wider">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Instant Eligibility Check</span>
                        </div>
                        <h2 className="font-serif text-lg font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-0.5">
                          Test In 10 Seconds
                        </h2>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C6A66B]/15 text-[#D97706] dark:text-[#F4A340]">
                        No Login Required
                      </span>
                    </div>

                    <form onSubmit={handleQuickCheckSubmit} className="space-y-3.5">
                      {/* Residency / Nationality Toggle */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Citizenship / Residency
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EEE7DA]/60 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852]">
                          <button
                            type="button"
                            onClick={() => handleQuickNationalityChange('Indian')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              quickCheck.nationality === 'Indian'
                                ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span>🇮🇳 Indian Citizen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickNationalityChange('International')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              quickCheck.nationality === 'International'
                                ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B]" />
                            <span>Outside India</span>
                          </button>
                        </div>
                      </div>

                      {/* Conditional Fields: Indian shows Category + State; Outside India shows Region */}
                      {quickCheck.nationality === 'Indian' ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Social Category
                            </label>
                            <select
                              value={quickCheck.category}
                              onChange={(e) =>
                                setQuickCheck({ ...quickCheck, category: e.target.value })
                              }
                              className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                            >
                              {INDIAN_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Home State
                            </label>
                            <select
                              value={quickCheck.state}
                              onChange={(e) =>
                                setQuickCheck({ ...quickCheck, state: e.target.value })
                              }
                              className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                            >
                              {INDIAN_STATES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Geographic Region
                          </label>
                          <select
                            value={quickCheck.state}
                            onChange={(e) =>
                              setQuickCheck({ ...quickCheck, state: e.target.value })
                            }
                            className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                          >
                            {INTERNATIONAL_REGIONS.map((reg) => (
                              <option key={reg} value={reg}>
                                {reg}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                            ✓ Indian caste reservation waived for international students.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Annual Family Income (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={quickCheck.income}
                            onChange={(e) =>
                              setQuickCheck({ ...quickCheck, income: e.target.value })
                            }
                            className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Qualifying Marks (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={quickCheck.marks}
                            onChange={(e) =>
                              setQuickCheck({ ...quickCheck, marks: e.target.value })
                            }
                            className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Academic Course Level
                        </label>
                        <select
                          value={quickCheck.course}
                          onChange={(e) =>
                            setQuickCheck({ ...quickCheck, course: e.target.value })
                          }
                          className="w-full rounded-xl bg-white dark:bg-[#0F1A2E] border border-slate-300 dark:border-[#1F324E] text-slate-900 dark:text-white text-xs px-3 py-2.5 focus:outline-none focus:border-[#356AE6]"
                        >
                          {COURSES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        data-sound="special"
                        className="w-full py-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                      >
                        <Sparkles className="w-4 h-4 text-[#F4A340]" />
                        <span>Run ML Match & View Matching Schemes</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CENTRAL SCHOLARSHIP DISCOVERY PREVIEW: Top Matched Schemes */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#642D42] dark:text-[#C6A66B]">
                  Verified Portal Directory
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-1">
                  Active Central, State & CSR Scholarships
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Accredited by National Scholarship Portal (NSP), UGC, AICTE, and verified corporate
                  partners. Click any scheme for an instant AI eligibility breakdown.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#172439] border border-[#C6A66B]/20 dark:border-[#263852] text-xs font-bold text-[#101B2D] dark:text-[#F8F5EF] hover:text-[#642D42] dark:text-[#C6A66B] dark:hover:text-[#642D42] dark:text-[#C6A66B] transition cursor-pointer shadow-xs"
              >
                <span>Browse All {enrichedScholarships.length || DEFAULT_SCHOLARSHIPS.length} Schemes</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B]" />
              </button>
            </div>

            {/* Clean, Informative Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(enrichedScholarships.length ? enrichedScholarships : DEFAULT_SCHOLARSHIPS)
                .slice(0, 3)
                .map((sch) => {
                  const ml = sch.mlResult || localRuleFallbackEngine(currentUser, sch);
                  const isEligible = ml.status === 'ELIGIBLE';
                  const isPartial = ml.status === 'PARTIAL';

                  return (
                    <div
                      key={sch.id}
                      className="bg-white dark:bg-[#172439] rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-6 shadow-[0_2px_8px_rgba(20,43,74,0.04)] hover:shadow-md hover:border-[#356AE6]/50 dark:hover:border-[#356AE6]/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isEligible
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : isPartial
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isEligible ? 'Eligible' : isPartial ? 'Partial Match' : 'Check Criteria'} •{' '}
                            {ml.matchScore}%
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                              sch.deadlineDays <= 30
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{sch.deadlineDays}d left</span>
                          </span>
                        </div>

                        {/* Provider Category & Title */}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#642D42] dark:text-[#C6A66B]">
                          {sch.provider}
                        </span>
                        <h3 className="font-serif text-base font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-1 leading-snug line-clamp-2">
                          {sch.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{sch.ministry}</span>
                        </p>

                        {/* Grant Amount & Criteria Preview */}
                        <div className="my-4 p-3 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/15 dark:border-[#263852] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Benefit Grant
                            </span>
                            <span className="text-lg font-extrabold text-[#101B2D] dark:text-[#F8F5EF] flex items-center">
                              <IndianRupee className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B]" />
                              {sch.amount.toLocaleString('en-IN')}
                              <span className="text-[11px] font-normal text-slate-500 ml-1">/ yr</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Min Marks
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {sch.minMarks}%
                            </span>
                          </div>
                        </div>

                        {/* ML Insight Snippet */}
                        <div className="p-3 rounded-xl bg-[#356AE6]/5 dark:bg-[#356AE6]/10 border border-[#356AE6]/15 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                          <div className="flex items-center gap-1 font-bold text-[#642D42] dark:text-[#C6A66B] mb-0.5">
                            <Sparkles className="w-3 h-3 text-[#F4A340]" />
                            <span>AI Eligibility Insight</span>
                          </div>
                          <p className="line-clamp-2">{ml.aiReason}</p>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex items-center gap-2 pt-3 border-t border-[#C6A66B]/15 dark:border-[#263852]">
                        <button
                          type="button"
                          onClick={() => openScholarshipDetail(sch)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 text-white font-bold text-xs transition text-center cursor-pointer"
                        >
                          AI Breakdown & Details
                        </button>
                        <a
                          href={sch.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] text-[#142B4A] dark:text-slate-200 font-bold text-xs transition flex items-center gap-1"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3 text-[#642D42] dark:text-[#C6A66B]" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* PRACTICAL STUDENT READINESS TOOLKIT SECTION */}
          <section
            id="practical-toolkit"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-[#C6A66B]/20 dark:border-[#263852]"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#642D42] dark:text-[#C6A66B]">
                  Student Success Hub
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-1">
                  Practical DBT Document Readiness
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Over 68% of rejected scholarship applications fail due to unseeded bank accounts or
                  outdated certificates. Use this interactive readiness checklist before applying.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {checklistReadyCount} of {PRACTICAL_CHECKLIST.length} Documents Ready
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Interactive Checklist Cards */}
              <div className="lg:col-span-7 space-y-3">
                {PRACTICAL_CHECKLIST.map((item) => {
                  const checked = !!checklistState[item.id];
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-[#172439] border-[#C6A66B]/20 dark:border-[#263852] hover:border-[#356AE6]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="mt-1 w-4 h-4 accent-[#356AE6] rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-bold ${
                            checked
                              ? 'text-emerald-900 dark:text-emerald-300 line-through'
                              : 'text-[#101B2D] dark:text-[#F8F5EF]'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      {checked && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Government DBT Avoid Rejection Guide */}
              <div className="lg:col-span-5 bg-[#142B4A] text-white rounded-2xl p-6 sm:p-7 border border-slate-800 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#F4A340]" />
                    <span>Avoid Common Rejections</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    Top 3 Reasons Portals Reject Applications
                  </h3>
                  <ul className="space-y-3.5 text-xs text-slate-300">
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-[#F4A340] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        <strong className="text-white">Aadhaar Bank NPCI Unseeded:</strong> Bank
                        account must be actively mapped with NPCI DBT mapper at your branch, not just
                        KYC linked.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-[#F4A340] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        <strong className="text-white">Expired Income Certificate:</strong> Revenue
                        authority certificate must be for the current financial year (April onwards).
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-[#F4A340] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        <strong className="text-white">Name Spelling Discrepancy:</strong> Name on
                        Aadhaar, Matriculation 10th marksheet, and Bank account must match exactly.
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-6 w-full py-3 rounded-xl bg-[#C6A66B] hover:bg-[#E08F2D] text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Go to Full Explorer & Match Schemes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: SCHOLARSHIP DISCOVERY & DASHBOARD (CENTRAL EXPERIENCE)     */}
      {/* =================================================================== */}
      {activeView === 'dashboard' && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Top Breadcrumb & BACK BUTTON (Requirement 2: add a back button) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#C6A66B]/20 dark:border-[#263852]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-[#142B4A] dark:text-slate-200 bg-white dark:bg-[#172439] border border-[#C6A66B]/20 dark:border-[#263852] hover:bg-slate-50 dark:hover:bg-[#1B2B47] hover:border-[#356AE6] dark:hover:border-[#356AE6] transition cursor-pointer group shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B] transition-transform group-hover:-translate-x-1" />
                <span>Back to Overview</span>
              </button>

              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Scholarship Discovery & Explorer
              </span>
            </div>

            {/* Live API Health & Connection Indicator */}
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  apiStatus.color === 'emerald'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiStatus.color === 'emerald'
                      ? 'bg-emerald-500'
                      : 'bg-[#C6A66B] animate-pulse'
                  }`}
                />
                <span>{apiStatus.label}</span>
              </span>

              <button
                type="button"
                onClick={() => refreshAllData(currentUser, apiConfig)}
                className="p-2 rounded-lg bg-white dark:bg-[#172439] border border-[#C6A66B]/20 dark:border-[#263852] text-slate-700 dark:text-slate-200 hover:text-[#642D42] dark:text-[#C6A66B] hover:border-[#356AE6] transition cursor-pointer shadow-xs"
                title="Refresh ML match scores"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingML ? 'animate-spin text-[#642D42] dark:text-[#C6A66B]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Dashboard Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                Scholarship Discovery Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Evaluated against verified criteria using personalized ML matching.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={openEditProfileModal}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#172439] border border-[#C6A66B]/20 dark:border-[#263852] hover:border-[#356AE6] text-[#142B4A] dark:text-slate-200 font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B]" />
                <span>Adjust Profile</span>
              </button>
              <button
                type="button"
                data-sound="special"
                onClick={() => refreshAllData(currentUser, apiConfig)}
                className="px-4 py-2 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingML ? 'animate-spin' : ''}`} />
                <span>Re-Evaluate ML</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            <div className="bg-white dark:bg-[#172439] p-4 sm:p-5 rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Eligible Schemes
                </p>
                <p className="text-xl sm:font-serif text-2xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                  {dashboardStats.eligibleCount}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#172439] p-4 sm:p-5 rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B] flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Eligible Grant Total
                </p>
                <p className="text-xl sm:font-serif text-2xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                  ₹{dashboardStats.totalFunding.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#172439] p-4 sm:p-5 rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Closing Soon (&le;30d)
                </p>
                <p className="text-xl sm:font-serif text-2xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                  {dashboardStats.urgentCount}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#172439] p-4 sm:p-5 rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#C6A66B]/15 text-[#D97706] dark:text-[#F4A340] flex items-center justify-center shrink-0">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tracked / Saved
                </p>
                <p className="text-xl sm:font-serif text-2xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                  {dashboardStats.trackedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Active Student Profile Banner Strip */}
          <div className="bg-[#142B4A] text-white rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#F4A340]">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">{currentUser.name || 'Guest Student'}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div>
                <span className="text-slate-400">Residency:</span>{' '}
                <strong>
                  {(currentUser.nationality || 'Indian') === 'Indian'
                    ? '🇮🇳 Indian'
                    : '🌍 International'}
                </strong>
              </div>
              {(currentUser.nationality || 'Indian') === 'Indian' && (
                <div>
                  <span className="text-slate-400">Category:</span>{' '}
                  <strong>{currentUser.category}</strong>
                </div>
              )}
              <div>
                <span className="text-slate-400">Family Income:</span>{' '}
                <strong>₹{Number(currentUser.income).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>{' '}
                <strong>{currentUser.state}</strong>
              </div>
              <div>
                <span className="text-slate-400">Marks:</span>{' '}
                <strong className="text-[#F4A340]">{currentUser.marks}%</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditProfileModal}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#C6A66B] text-slate-950 hover:bg-[#E08F2D] transition cursor-pointer"
            >
              Update Profile
            </button>
          </div>

          {/* Quick Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Schemes' },
              { id: 'Central Govt', label: 'Central Govt (NSP)' },
              { id: 'State Govt', label: 'State Welfare Schemes' },
              { id: 'Corporate CSR', label: 'Corporate CSR' },
              { id: 'International', label: 'International / Global' },
              { id: 'CLOSING_SOON', label: 'Closing Soon (≤30d)' },
              { id: 'HIGH_VALUE', label: 'High Grant (≥₹50k)' }
            ].map((cat) => {
              const active = categoryQuickFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { soundFx.play('click'); setCategoryQuickFilter(cat.id); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#356AE6] text-white shadow-xs'
                      : 'bg-white dark:bg-[#172439] text-slate-600 dark:text-slate-300 border border-[#C6A66B]/20 dark:border-[#263852] hover:border-[#356AE6]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search, Filter & Sort Controls Bar */}
          <div className="bg-white dark:bg-[#172439] p-4 rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] shadow-xs mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scholarship title, ministry, or keyword..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#356AE6]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Eligibility Filter */}
              <div className="md:col-span-2">
                <select
                  value={eligibilityFilter}
                  onChange={(e) => setEligibilityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#356AE6]"
                >
                  <option value="ALL">All Match Status</option>
                  <option value="ELIGIBLE">Fully Eligible Only</option>
                  <option value="PARTIAL">Partial Match</option>
                  <option value="NOT_ELIGIBLE">Ineligible</option>
                </select>
              </div>

              {/* Provider Filter */}
              <div className="md:col-span-3">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#356AE6]"
                >
                  <option value="ALL">All Scheme Providers</option>
                  <option value="Central Govt">Central Govt (NSP)</option>
                  <option value="State Govt">State Welfare Boards</option>
                  <option value="Corporate CSR">Corporate CSR</option>
                  <option value="International">International / Global</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#356AE6]"
                >
                  <option value="SCORE">Sort: ML Match %</option>
                  <option value="DEADLINE">Sort: Deadline</option>
                  <option value="AMOUNT">Sort: Grant Amount</option>
                </select>
              </div>
            </div>

            {/* Active Filters Bar and Clear Button */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#C6A66B]/15 dark:border-[#263852] text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Showing <strong>{filteredScholarships.length}</strong> matching scholarships
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-bold text-[#642D42] dark:text-[#C6A66B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Scholarship Discovery Cards Grid */}
          {filteredScholarships.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#172439] rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                No matching scholarships found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Try widening your search terms, resetting category filters, or updating your student
                qualifying marks and income profile.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-[#356AE6] text-white font-bold text-xs cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScholarships.map((sch) => {
                const { matchScore, status, aiReason } = sch.mlResult;
                const isEligible = status === 'ELIGIBLE';
                const isPartial = status === 'PARTIAL';
                const currentStatus = trackedApplications[sch.id] || '';

                return (
                  <div
                    key={sch.id}
                    className="bg-white dark:bg-[#172439] rounded-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-5 sm:p-6 shadow-[0_2px_8px_rgba(20,43,74,0.04)] hover:shadow-lg hover:border-[#356AE6]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges: Status & Deadline */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isEligible
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isPartial
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isEligible ? 'Eligible' : isPartial ? 'Partial Match' : 'Not Eligible'} •{' '}
                          {matchScore}%
                        </span>

                        {sch.deadlineDays <= 30 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{sch.deadlineDays}d left</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {sch.deadlineDate}
                          </span>
                        )}
                      </div>

                      {/* Provider & Title */}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#642D42] dark:text-[#C6A66B]">
                        {sch.provider}
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-1 leading-snug line-clamp-2">
                        {sch.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{sch.ministry}</span>
                      </p>

                      {/* Benefit Grant Box */}
                      <div className="my-3.5 p-3 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/15 dark:border-[#263852] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Scholarship Benefit
                          </span>
                          <span className="text-lg font-extrabold text-[#101B2D] dark:text-[#F8F5EF] flex items-center">
                            <IndianRupee className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B]" />
                            {sch.amount.toLocaleString('en-IN')}{' '}
                            <span className="text-[11px] font-normal text-slate-500 ml-1">/ yr</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">
                            Min Marks
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {sch.minMarks}%
                          </span>
                        </div>
                      </div>

                      {/* AI Eligibility Insight Snippet */}
                      <div className="p-3 rounded-xl bg-[#356AE6]/5 dark:bg-[#356AE6]/10 border border-[#356AE6]/15 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        <div className="flex items-center gap-1 font-bold text-[#642D42] dark:text-[#C6A66B] mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#F4A340]" />
                          <span>ML Match Insight</span>
                        </div>
                        <p className="line-clamp-2">{aiReason}</p>
                      </div>
                    </div>

                    {/* Action Footer & Application Tracking */}
                    <div className="pt-3 border-t border-[#C6A66B]/15 dark:border-[#263852] space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openScholarshipDetail(sch)}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 text-white font-bold text-xs transition text-center cursor-pointer"
                        >
                          AI Breakdown & Details
                        </button>
                        <a
                          href={sch.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] text-[#142B4A] dark:text-slate-200 font-bold text-xs transition flex items-center gap-1"
                          title="Apply on Official Portal"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B]" />
                        </a>
                      </div>

                      {/* Quick Status Pill */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>My Tracker:</span>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(sch.id, e.target.value)}
                          className="bg-transparent font-bold text-xs text-[#642D42] dark:text-[#C6A66B] cursor-pointer focus:outline-none"
                        >
                          <option value="">+ Mark Status</option>
                          <option value="Saved">📌 Saved for Later</option>
                          <option value="Applied">✓ Applied</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: SCHOLARSHIP DETAILS & AI EXPLANATION                       */}
      {/* (Includes dedicated BACK BUTTON)                                   */}
      {/* =================================================================== */}
      {detailModal.open && detailModal.scholarship && (
        <div
          className="fixed inset-0 z-50 bg-[#142B4A]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => { soundFx.play('modalClose'); setDetailModal({ ...detailModal, open: false }); }}
        >
          <div
            className="bg-white dark:bg-[#172439] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-6 sm:p-8 relative my-auto text-[#25282D] dark:text-[#F8F5EF]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Navigation Row: Dedicated BACK BUTTON & Close Button */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#C6A66B]/15 dark:border-[#263852]">
              <button
                type="button"
                onClick={() => { soundFx.play('modalClose'); setDetailModal({ ...detailModal, open: false }); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#142B4A] dark:text-slate-200 bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] transition cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B] transition-transform group-hover:-translate-x-1" />
                <span>Back to Scholarships</span>
              </button>

              <button
                type="button"
                onClick={() => { soundFx.play('modalClose'); setDetailModal({ ...detailModal, open: false }); }}
                className="w-8 h-8 rounded-full bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailModal.loading ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 font-semibold space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#642D42] dark:text-[#C6A66B]" />
                <p>Querying ML Model API for personalized eligibility breakdown...</p>
              </div>
            ) : (
              (() => {
                const sch = detailModal.scholarship;
                const ml = detailModal.mlDetail;
                const currentStatus = trackedApplications[sch.id] || '';

                return (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B]">
                        {sch.provider}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{sch.ministry}</span>
                    </div>

                    <h2 className="font-serif text-2xl font-bold text-[#101B2D] dark:text-[#F8F5EF] mt-2">
                      {sch.title}
                    </h2>

                    {/* Quick Metric Cards */}
                    <div className="grid grid-cols-3 gap-3 my-6">
                      <div className="p-3.5 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Benefit Grant
                        </span>
                        <p className="text-lg font-extrabold text-[#101B2D] dark:text-[#F8F5EF] mt-0.5 flex items-center">
                          <IndianRupee className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B]" />
                          {sch.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Deadline
                        </span>
                        <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                          {sch.deadlineDate}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#EEE7DA]/40 dark:bg-[#121E31] border border-[#C6A66B]/20 dark:border-[#263852]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          ML Match Score
                        </span>
                        <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {ml.matchScore}%
                        </p>
                      </div>
                    </div>

                    {/* AI Explanation Box */}
                    <div className="p-4 rounded-xl bg-[#356AE6]/10 dark:bg-[#356AE6]/15 border border-[#356AE6]/20 mb-6">
                      <div className="flex items-center gap-2 font-extrabold text-[#101B2D] dark:text-[#F8F5EF] text-xs mb-1.5">
                        <Bot className="w-4 h-4 text-[#642D42] dark:text-[#C6A66B]" />
                        <span>AI-Generated Eligibility Assessment</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {ml.aiReason}
                      </p>
                    </div>

                    {/* Criteria Evaluation Checklist */}
                    <h4 className="font-bold text-[#101B2D] dark:text-[#F8F5EF] text-xs uppercase tracking-wider mb-2.5">
                      Criterion-by-Criterion Evaluation
                    </h4>
                    <div className="space-y-2 mb-6">
                      {(ml.criteriaBreakdown || []).map((c, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            c.passed
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-[#101B2D] dark:text-[#F8F5EF]">{c.label}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{c.detail}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.passed
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                            }`}
                          >
                            {c.passed ? 'PASSED' : 'MISMATCH'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Required Documents */}
                    <h4 className="font-bold text-[#101B2D] dark:text-[#F8F5EF] text-xs uppercase tracking-wider mb-2">
                      Required Documents Checklist
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                      {sch.documents.map((doc, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-[#EEE7DA]/40 dark:bg-[#121E31] px-3 py-2 rounded-xl border border-[#C6A66B]/20 dark:border-[#263852]"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#642D42] dark:text-[#C6A66B] shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tracking Status & Direct Official Link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#C6A66B]/20 dark:border-[#263852]">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          My Status:
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(sch.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-xs font-bold text-slate-800 dark:text-white"
                        >
                          <option value="">Not Applied</option>
                          <option value="Saved">Saved for Later</option>
                          <option value="Applied">Submitted Application</option>
                        </select>
                      </div>

                      <a
                        href={sch.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <span>Apply on Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: LOGIN & REGISTRATION MODAL                                 */}
      {/* =================================================================== */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-50 bg-[#142B4A]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => { soundFx.play('modalClose'); setAuthModal({ ...authModal, open: false }); }}
        >
          <div
            className="bg-white dark:bg-[#172439] rounded-2xl max-w-lg w-full shadow-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-6 sm:p-8 relative my-auto text-[#25282D] dark:text-[#F8F5EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { soundFx.play('modalClose'); setAuthModal({ ...authModal, open: false }); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Login / Register Tab Switcher */}
            <div className="flex gap-1.5 p-1 bg-[#EEE7DA]/60 dark:bg-[#121E31] rounded-xl mb-6 w-fit border border-[#C6A66B]/20 dark:border-[#263852]">
              <button
                type="button"
                onClick={() => (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'login' }); })()}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authModal.tab === 'login'
                    ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => (() => { soundFx.play('modalOpen'); setAuthModal({ open: true, tab: 'register' }); })()}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  authModal.tab === 'register'
                    ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {authModal.tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                    Sign In to Scholars Sathi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Connects to backend route:{' '}
                    <code className="bg-[#EEE7DA]/60 dark:bg-[#121E31] px-1 py-0.5 rounded text-[#642D42] dark:text-[#C6A66B]">
                      /auth/login
                    </code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#356AE6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#356AE6]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Sign In & Load Matched Schemes
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                    Create Student Profile
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Connects to backend route:{' '}
                    <code className="bg-[#EEE7DA]/60 dark:bg-[#121E31] px-1 py-0.5 rounded text-[#642D42] dark:text-[#C6A66B]">
                      /auth/register
                    </code>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ananya Roy"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ananya@college.edu"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                {/* Residency / Nationality Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Citizenship Status
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EEE7DA]/60 dark:bg-[#121E31]">
                    <button
                      type="button"
                      onClick={() =>
                        setRegisterForm({
                          ...registerForm,
                          nationality: 'Indian',
                          category: 'OBC',
                          state: 'Assam'
                        })
                      }
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        registerForm.nationality === 'Indian'
                          ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🇮🇳 Indian Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRegisterForm({
                          ...registerForm,
                          nationality: 'International',
                          category: 'International',
                          state: 'Outside India (SAARC / Asia)'
                        })
                      }
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        registerForm.nationality === 'International'
                          ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🌍 Outside India
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  {registerForm.nationality === 'Indian' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={registerForm.category}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                      >
                        {INDIAN_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Region
                      </label>
                      <select
                        value={registerForm.state}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, state: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                      >
                        {INTERNATIONAL_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div
                  className={`grid ${
                    registerForm.nationality === 'Indian' ? 'grid-cols-3' : 'grid-cols-2'
                  } gap-2.5`}
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Income (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={registerForm.income}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, income: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  {registerForm.nationality === 'Indian' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        State
                      </label>
                      <select
                        value={registerForm.state}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, state: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Marks (%)
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={registerForm.marks}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, marks: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Level
                  </label>
                  <select
                    value={registerForm.course}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, course: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Register Account & Recalculate
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: EDIT STUDENT PROFILE MODAL                                 */}
      {/* =================================================================== */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#142B4A]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => { soundFx.play('modalClose'); setProfileModalOpen(false); }}
        >
          <div
            className="bg-white dark:bg-[#172439] rounded-2xl max-w-lg w-full shadow-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-6 sm:p-8 relative text-[#25282D] dark:text-[#F8F5EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { soundFx.play('modalClose'); setProfileModalOpen(false); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#101B2D] dark:text-[#F8F5EF] mb-1">
              Edit Academic & Financial Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Updates your profile & dynamically triggers ML match recalculation.
            </p>

            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Nationality Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Residency Status
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EEE7DA]/60 dark:bg-[#121E31]">
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        nationality: 'Indian',
                        category:
                          profileForm.category === 'International' ? 'OBC' : profileForm.category,
                        state: profileForm.state.startsWith('Outside') ? 'Assam' : profileForm.state
                      })
                    }
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      profileForm.nationality === 'Indian'
                        ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🇮🇳 Indian Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        nationality: 'International',
                        category: 'International',
                        state: 'Outside India (SAARC / Asia)'
                      })
                    }
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      profileForm.nationality === 'International'
                        ? 'bg-white dark:bg-[#1B2B47] text-[#101B2D] dark:text-[#F8F5EF] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🌍 Outside India
                  </button>
                </div>
              </div>

              <div
                className={`grid ${
                  profileForm.nationality === 'Indian' ? 'grid-cols-2' : 'grid-cols-1'
                } gap-2.5`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  />
                </div>

                {profileForm.nationality === 'Indian' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Social Category
                    </label>
                    <select
                      value={profileForm.category}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                    >
                      {INDIAN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Family Income (₹)
                  </label>
                  <input
                    type="number"
                    value={profileForm.income}
                    onChange={(e) => setProfileForm({ ...profileForm, income: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {profileForm.nationality === 'Indian' ? 'Home State' : 'Region'}
                  </label>
                  <select
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  >
                    {(profileForm.nationality === 'Indian'
                      ? INDIAN_STATES
                      : INTERNATIONAL_REGIONS
                    ).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Qualifying Marks (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={profileForm.marks}
                    onChange={(e) => setProfileForm({ ...profileForm, marks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course Level
                  </label>
                  <select
                    value={profileForm.course}
                    onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                data-sound="special"
                className="w-full py-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md transition cursor-pointer"
              >
                Save Profile & Recalculate ML Scores
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: BACKEND & ML API INTEGRATION CONFIG MODAL                  */}
      {/* =================================================================== */}
      {apiConfigModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#142B4A]/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => { soundFx.play('modalClose'); setApiConfigModalOpen(false); }}
        >
          <div
            className="bg-white dark:bg-[#172439] rounded-2xl max-w-xl w-full shadow-2xl border border-[#C6A66B]/20 dark:border-[#263852] p-6 sm:p-8 relative text-[#25282D] dark:text-[#F8F5EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { soundFx.play('modalClose'); setApiConfigModalOpen(false); }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#EEE7DA]/60 dark:bg-[#121E31] hover:bg-slate-200 dark:hover:bg-[#1B2B47] flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#356AE6]/10 text-[#642D42] dark:text-[#C6A66B] flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#101B2D] dark:text-[#F8F5EF]">
                  Backend & ML Model Endpoints
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure live REST API server and Python ML Model prediction endpoints
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveApiConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Backend Server Base URL (Auth, Profile, Scholarships DB)
                </label>
                <input
                  type="url"
                  value={cfgForm.backendUrl}
                  onChange={(e) => setCfgForm({ ...cfgForm, backendUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs font-mono"
                  placeholder="http://localhost:5000/api"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Endpoints used: <code>/auth/login</code>, <code>/auth/register</code>,{' '}
                  <code>/student/profile</code>, <code>/scholarships</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ML Model API Base URL (Predictions & AI Explanations)
                </label>
                <input
                  type="url"
                  value={cfgForm.mlUrl}
                  onChange={(e) => setCfgForm({ ...cfgForm, mlUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#1F324E] bg-white dark:bg-[#0F1A2E] text-slate-900 dark:text-white text-xs font-mono"
                  placeholder="http://localhost:8000/ml"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Endpoints used: <code>/predict-eligibility</code>, <code>/explain-match</code>
                </p>
              </div>

              <div className="bg-[#EEE7DA]/40 dark:bg-[#121E31] p-3.5 rounded-xl border border-[#C6A66B]/20 dark:border-[#263852] text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-[#101B2D] dark:text-[#F8F5EF]">Active Response Protocol:</strong>
                <pre className="mt-1.5 text-[11px] overflow-x-auto text-slate-800 dark:text-slate-300 font-mono">
                  {`{ "predictions": [{ "scholarshipId": 1, "matchScore": 94, "status": "ELIGIBLE", "aiReason": "..." }] }`}
                </pre>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#642D42] hover:bg-[#522435] text-[#F8F5EF] border border-[#C6A66B]/30 font-bold text-xs shadow-md transition cursor-pointer"
              >
                Save Endpoints & Connect
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* GOVERNMENT-TECH & EDTECH FOOTER                                     */}
      {/* =================================================================== */}
      <footer className="mt-auto bg-[#101B2D] text-slate-300 border-t border-[#C6A66B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/10 text-xs">
            {/* Col 1: Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#356AE6] text-white flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#F4A340]" />
                </div>
                <span className="text-lg font-extrabold text-white">
                  Scholarship <span className="text-[#F4A340]">Sathi</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                National EdTech + Government-Tech platform for transparent scholarship discovery,
                AI-verified eligibility calculations, and DBT Aadhaar-seeding readiness.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Agent Commission • Direct Portals</span>
              </div>
            </div>

            {/* Col 2: Official Portals */}
            <div>
              <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">
                Official Portals
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a
                    href="https://scholarships.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <span>National Scholarship Portal (NSP)</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.aicte-india.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <span>AICTE Pragati / Saksham</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.ugc.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <span>UGC Ishan Uday Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.studyinindia.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <span>Study in India (SII) Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Student Tools */}
            <div>
              <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">
                Student Resources
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('home');
                      setTimeout(() => {
                        document
                          .getElementById('practical-toolkit')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="hover:text-white transition text-left cursor-pointer"
                  >
                    NPCI Aadhaar Bank Seeding Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('dashboard');
                      setEligibilityFilter('ELIGIBLE');
                    }}
                    className="hover:text-white transition text-left cursor-pointer"
                  >
                    Eligible Schemes Tracker
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="hover:text-white transition text-left cursor-pointer"
                  >
                    Student Academic Profile
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCfgForm({
                        backendUrl: apiConfig.BACKEND_BASE_URL,
                        mlUrl: apiConfig.ML_API_BASE_URL
                      });
                      setApiConfigModalOpen(true);
                    }}
                    className="hover:text-white transition text-left cursor-pointer"
                  >
                    Configure Local / Live ML Engine
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: National Helpline */}
            <div>
              <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">
                National Helpline & Support
              </h4>
              <p className="text-slate-400 mb-2">
                NSP Helpdesk: <strong className="text-white">0120 - 6619540</strong>
              </p>
              <p className="text-slate-400 mb-2">
                Toll-Free DBT: <strong className="text-white">1800 - 11 - 2001</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Email:{' '}
                <a
                  href="mailto:helpdesk@nsp.gov.in"
                  className="text-[#642D42] dark:text-[#C6A66B] hover:underline"
                >
                  helpdesk@nsp.gov.in
                </a>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
            <p>
              © {new Date().getFullYear()} Scholarship Sathi. Designed under Modern EdTech +
              Government-Tech Minimalism guidelines.
            </p>
            <div className="flex items-center gap-4">
              <span>National Direct Benefit Transfer (DBT) Compliant</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-white transition cursor-pointer text-[#F4A340] font-bold"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
