import React, { useState, useMemo, useEffect } from 'react';
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
  LayoutDashboard,
  IndianRupee,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  Menu,
  X,
  RefreshCw,
  Compass,
  FileCheck2,
  Plug,
  Cpu,
  Server,
  Bot,
  Globe,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// 1. API INTEGRATION CONFIGURATION LAYER (BACKEND & ML MODEL API ENDPOINTS)
// ============================================================================
const DEFAULT_API_CONFIG = {
  BACKEND_BASE_URL: 'http://localhost:5000/api',
  ML_API_BASE_URL: 'http://localhost:8000/ml',
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
/**
 * Evaluates student eligibility locally whenever the external Python ML API
 * is unreachable. Dynamically adapts criteria based on residency:
 * - Indian Citizen: evaluates Social Category, State Domicile, Income, Marks, Course.
 * - Outside India: waives Social Category and evaluates International eligibility.
 */
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
// 4. MAIN SCHOLARS SATHI REACT APPLICATION
// ============================================================================
export default function ScholarsSathi() {
  // View & Responsive Navigation State
  const [activeView, setActiveView] = useState('home'); // 'home' | 'dashboard'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      setApiStatus({ label: 'ML API Connected', color: 'emerald' });
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
    setActiveView('home');
  };

  // ==========================================================================
  // HANDLERS: PROFILE EDITOR & API CONFIGURATION
  // ==========================================================================
  const openEditProfileModal = () => {
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
    const next = { ...checklistState, [id]: !checklistState[id] };
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
    const urgent = eligible.filter((s) => s.deadlineDays <= 15).length;
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
        const matchesSearch =
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.ministry.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          eligibilityFilter === 'ALL' || s.mlResult?.status === eligibilityFilter;
        const matchesProvider =
          providerFilter === 'ALL' || s.provider === providerFilter;
        return matchesSearch && matchesStatus && matchesProvider;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE')
          return (b.mlResult?.matchScore || 0) - (a.mlResult?.matchScore || 0);
        if (sortBy === 'DEADLINE') return a.deadlineDays - b.deadlineDays;
        if (sortBy === 'AMOUNT') return b.amount - a.amount;
        return 0;
      });
  }, [enrichedScholarships, searchQuery, eligibilityFilter, providerFilter, sortBy]);

  const checklistReadyCount = useMemo(
    () => PRACTICAL_CHECKLIST.filter((item) => checklistState[item.id]).length,
    [checklistState]
  );

  // ==========================================================================
  // RENDER UI
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white flex flex-col">
      {/* =================================================================== */}
      {/* TOP NAVIGATION BAR                                                  */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Scholars <span className="text-indigo-600">Sathi</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI + ML Portal
              </span>
            </div>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className={`transition cursor-pointer ${
                activeView === 'home' ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'dashboard'
                  ? 'text-indigo-600 font-bold'
                  : 'hover:text-indigo-600'
              }`}
            >
              <span>Scholarship Explorer</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {DEFAULT_SCHOLARSHIPS.length} Live
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
                }, 60);
              }}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Document Checklist
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
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
              title="Configure Backend & ML Model API URLs"
            >
              <Plug className="w-3.5 h-3.5 text-indigo-600" />
              <span>API Config</span>
            </button>
          </nav>

          {/* Right Auth Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentUser.isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{currentUser.name}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, tab: 'login' })}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, tab: 'register' })}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveView('home');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                Scholarship Explorer
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
                className="text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-indigo-600"
              >
                Configure Backend & ML API
              </button>
            </div>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              {currentUser.isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="col-span-2 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold"
                >
                  Logout ({currentUser.name})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal({ open: true, tab: 'login' });
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal({ open: true, tab: 'register' });
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
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
      {/* VIEW 1: DEFAULT HOME LANDING PAGE                                   */}
      {/* =================================================================== */}
      {activeView === 'home' && (
        <main className="flex-1">
          {/* HERO BANNER */}
          <section
            className="text-white relative overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at top right, #4f46e5 0%, #1e1b4b 45%, #0f172a 100%)'
            }}
          >
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#a5b4fc 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22 relative z-10">
              <div className="grid lg:grid-cols-12 gap-12 items-center">
                {/* Left Hero Copy & CTA Buttons */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Smart ML Eligibility Engine & Automated Deadline Alerts</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    Never Miss a Scholarship You{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-300">
                      Actually Deserve.
                    </span>
                  </h1>

                  <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                    Scholars Sathi matches your academic marks, family income, state or
                    international residency, and course against verified central, state, CSR, and
                    global scholarships—complete with AI explanations so you apply with confidence.
                  </p>

                  {/* Hero Banner Action Buttons */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('dashboard')}
                      className="px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/20 transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                    >
                      <Compass className="w-5 h-5" />
                      <span>Explore Scholarships</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthModal({ open: true, tab: 'register' })}
                      className="px-7 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-base backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>Register Free</span>
                    </button>
                  </div>

                  {/* Trust Metrics */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 max-w-lg">
                    <div>
                      <p className="text-2xl font-extrabold text-white">₹4.8 Cr+</p>
                      <p className="text-xs text-slate-400">Active Grants Listed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-amber-300">96.4%</p>
                      <p className="text-xs text-slate-400">ML Match Precision</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-emerald-300">Zero Fee</p>
                      <p className="text-xs text-slate-400">Direct Portal Links</p>
                    </div>
                  </div>
                </div>

                {/* Right Instant Eligibility Check Card (Conditional Indian vs Outside India) */}
                <div className="lg:col-span-5">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-xl font-bold text-white">Instant Eligibility Check</h2>
                        <p className="text-xs text-indigo-200">
                          Test your profile in 10 seconds without signing up
                        </p>
                      </div>
                      <span className="p-2.5 rounded-xl bg-indigo-500/30 text-amber-300">
                        <Cpu className="w-6 h-6" />
                      </span>
                    </div>

                    <form onSubmit={handleQuickCheckSubmit} className="space-y-4">
                      {/* Residency / Nationality Toggle */}
                      <div>
                        <label className="block text-xs font-semibold text-indigo-200 mb-1.5">
                          Nationality / Residency Status
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/70 border border-white/15">
                          <button
                            type="button"
                            onClick={() => handleQuickNationalityChange('Indian')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              quickCheck.nationality === 'Indian'
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            <span>🇮🇳 Indian Citizen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickNationalityChange('International')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              quickCheck.nationality === 'International'
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Outside India</span>
                          </button>
                        </div>
                      </div>

                      {/* Conditional Fields: Indian shows Social Category + Home State; Outside India hides Category */}
                      {quickCheck.nationality === 'Indian' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-indigo-200 mb-1">
                              Social Category
                            </label>
                            <select
                              value={quickCheck.category}
                              onChange={(e) =>
                                setQuickCheck({ ...quickCheck, category: e.target.value })
                              }
                              className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
                            >
                              {INDIAN_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-indigo-200 mb-1">
                              Home State
                            </label>
                            <select
                              value={quickCheck.state}
                              onChange={(e) =>
                                setQuickCheck({ ...quickCheck, state: e.target.value })
                              }
                              className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
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
                          <label className="block text-xs font-semibold text-indigo-200 mb-1">
                            Country / Region (Outside India)
                          </label>
                          <select
                            value={quickCheck.state}
                            onChange={(e) =>
                              setQuickCheck({ ...quickCheck, state: e.target.value })
                            }
                            className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
                          >
                            {INTERNATIONAL_REGIONS.map((reg) => (
                              <option key={reg} value={reg}>
                                {reg}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-emerald-300 mt-1">
                            ✓ Indian caste/category criteria automatically waived for international
                            applicants.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-indigo-200 mb-1">
                            Annual Income (₹ eq.)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={quickCheck.income}
                            onChange={(e) =>
                              setQuickCheck({ ...quickCheck, income: e.target.value })
                            }
                            className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-indigo-200 mb-1">
                            Last Exam Marks (%)
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
                            className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-indigo-200 mb-1">
                          Current Course Level
                        </label>
                        <select
                          value={quickCheck.course}
                          onChange={(e) =>
                            setQuickCheck({ ...quickCheck, course: e.target.value })
                          }
                          className="w-full rounded-xl bg-slate-900/85 border border-white/20 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-amber-400"
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
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Run ML Match & View Results</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PRACTICAL STUDENT TOOLKIT SECTION */}
          <section
            id="practical-toolkit"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Daily Student Companion
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  Practical Scholarship Readiness Toolkit
                </h2>
                <p className="text-slate-600 mt-1 max-w-2xl">
                  Most student applications fail due to missing bank seeding or expired income
                  certificates—not low marks. Track your readiness below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Full Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Interactive Document Readiness Checklist */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        Document & DBT Readiness Tracker
                      </h3>
                      <p className="text-xs text-slate-500">Saved automatically in your browser</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {checklistReadyCount}/{PRACTICAL_CHECKLIST.length} Ready
                  </span>
                </div>

                <div className="space-y-3">
                  {PRACTICAL_CHECKLIST.map((item) => {
                    const checked = !!checklistState[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition ${
                          checked
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="mt-1 w-4 h-4 accent-indigo-600 rounded"
                        />
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              checked ? 'text-emerald-900 line-through' : 'text-slate-900'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Top 3 Rejection Prevention Tips */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Avoid Instant Rejection</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">3 Reasons Applications Get Rejected</h3>
                  <ul className="space-y-4 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        <strong className="text-white">Aadhaar Not NPCI-Seeded:</strong> Linking
                        Aadhaar to your bank account is not enough; enable DBT/NPCI mapping at your
                        bank branch.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        <strong className="text-white">Old Income Certificate:</strong> Ensure your
                        Tehsildar/Circle Officer income certificate is issued for the current
                        financial year.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/10 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        <strong className="text-white">Name Mismatch:</strong> Your name on Class 10
                        Marksheet, Aadhaar/Passport, and Bank Passbook must match letter-for-letter.
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="mt-8 w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-indigo-50 transition cursor-pointer"
                >
                  Check Eligible Schemes Now →
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: FULL SCHOLARSHIP DASHBOARD                                  */}
      {/* =================================================================== */}
      {activeView === 'dashboard' && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Top Dashboard Header & API Status Pill */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Student Scholarship Dashboard
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    apiStatus.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      apiStatus.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span>{apiStatus.label}</span>
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Personalized ML recommendations & deadline alerts based on your academic profile.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openEditProfileModal}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-500 text-slate-800 font-semibold text-sm shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Edit Student Profile</span>
              </button>
              <button
                type="button"
                onClick={() => refreshAllData(currentUser, apiConfig)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingML ? 'animate-spin' : ''}`} />
                <span>Re-Run ML Match</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Eligible Schemes</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardStats.eligibleCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Potential Funding</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{dashboardStats.totalFunding.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Closing Soon (&le;15d)
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardStats.urgentCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Saved / Applied</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardStats.trackedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Active Student Profile Banner Bar */}
          <div className="bg-indigo-950 text-white rounded-2xl p-4 sm:p-5 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-300" />
                <span className="font-bold">{currentUser.name || 'Guest Student'}</span>
              </div>
              <span className="text-indigo-400 hidden sm:inline">|</span>
              <div>
                <span className="text-indigo-300 text-xs">Residency:</span>{' '}
                <strong>
                  {(currentUser.nationality || 'Indian') === 'Indian'
                    ? '🇮🇳 Indian'
                    : '🌍 International'}
                </strong>
              </div>
              {(currentUser.nationality || 'Indian') === 'Indian' && (
                <div>
                  <span className="text-indigo-300 text-xs">Category:</span>{' '}
                  <strong>{currentUser.category}</strong>
                </div>
              )}
              <div>
                <span className="text-indigo-300 text-xs">Income:</span>{' '}
                <strong>₹{Number(currentUser.income).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-indigo-300 text-xs">Location:</span>{' '}
                <strong>{currentUser.state}</strong>
              </div>
              <div>
                <span className="text-indigo-300 text-xs">Marks:</span>{' '}
                <strong>{currentUser.marks}%</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={openEditProfileModal}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition cursor-pointer"
            >
              Update Profile
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by scholarship name, ministry, or keyword..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <select
                  value={eligibilityFilter}
                  onChange={(e) => setEligibilityFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ELIGIBLE">Eligible Only</option>
                  <option value="PARTIAL">Partial Match</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Providers</option>
                  <option value="Central Govt">Central Govt (NSP)</option>
                  <option value="State Govt">State Govt</option>
                  <option value="Corporate CSR">Corporate CSR</option>
                  <option value="International">International / Global</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="SCORE">Sort: ML Match %</option>
                  <option value="DEADLINE">Sort: Earliest Deadline</option>
                  <option value="AMOUNT">Sort: Highest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recommended Scholarships Grid */}
          {filteredScholarships.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
              <p className="text-lg font-bold text-slate-800">No matching scholarships found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try resetting your search filters or updating your student profile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScholarships.map((sch) => {
                const { matchScore, status, aiReason } = sch.mlResult;
                const badgeStyle =
                  status === 'ELIGIBLE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : status === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';
                const badgeText =
                  status === 'ELIGIBLE'
                    ? 'Eligible'
                    : status === 'PARTIAL'
                    ? 'Partial Match'
                    : 'Not Eligible';

                return (
                  <div
                    key={sch.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-xl hover:border-indigo-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}
                        >
                          {badgeText} • {matchScore}%
                        </span>

                        {sch.deadlineDays <= 15 ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                            Closes in {sch.deadlineDays}d
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            {sch.deadlineDate}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {sch.provider}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1 leading-snug">
                        {sch.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{sch.ministry}</p>

                      {/* Grant Amount */}
                      <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 block">
                            Scholarship Benefit
                          </span>
                          <span className="text-xl font-extrabold text-indigo-700">
                            ₹{sch.amount.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-normal text-slate-500">/ yr</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Min Marks</span>
                          <span className="text-sm font-bold text-slate-800">{sch.minMarks}%</span>
                        </div>
                      </div>

                      {/* AI Explanation Snippet */}
                      <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 leading-relaxed mb-5">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>ML Eligibility Insight</span>
                        </div>
                        <p className="line-clamp-3">{aiReason}</p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openScholarshipDetail(sch)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition text-center cursor-pointer"
                      >
                        AI Breakdown & Details
                      </button>
                      <a
                        href={sch.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
      {/* =================================================================== */}
      {detailModal.open && detailModal.scholarship && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDetailModal({ ...detailModal, open: false })}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModal({ ...detailModal, open: false })}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {detailModal.loading ? (
              <div className="py-12 text-center text-slate-500 font-semibold">
                Querying ML Model API for personalized explanation...
              </div>
            ) : (
              (() => {
                const sch = detailModal.scholarship;
                const ml = detailModal.mlDetail;
                const currentStatus = trackedApplications[sch.id] || '';
                return (
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      {sch.provider}
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{sch.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{sch.ministry}</p>

                    <div className="grid grid-cols-3 gap-4 my-6">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500">Grant Amount</span>
                        <p className="text-xl font-extrabold text-indigo-700 mt-0.5">
                          ₹{sch.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500">Deadline</span>
                        <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                          {sch.deadlineDate}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500">ML Match Score</span>
                        <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                          {ml.matchScore}%
                        </p>
                      </div>
                    </div>

                    {/* AI Explanation Box */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 mb-6">
                      <div className="flex items-center gap-2 font-extrabold text-indigo-900 text-sm mb-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        <span>AI-Generated Eligibility Explanation</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{ml.aiReason}</p>
                    </div>

                    {/* Criterion-by-Criterion Breakdown */}
                    <h4 className="font-bold text-slate-900 text-sm mb-3">
                      Criterion-by-Criterion Evaluation
                    </h4>
                    <div className="space-y-2.5 mb-6">
                      {(ml.criteriaBreakdown || []).map((c, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            c.passed
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-rose-50/50 border-rose-200'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{c.label}</p>
                            <p className="text-xs text-slate-600">{c.detail}</p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.passed ? 'PASS' : 'MISMATCH'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Required Documents */}
                    <h4 className="font-bold text-slate-900 text-sm mb-2">
                      Required Documents Checklist
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                      {sch.documents.map((doc, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"
                        >
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Track Status & Direct Official Link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">My Status:</label>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(sch.id, e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
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
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center gap-2"
                      >
                        <span>Proceed to Official Portal</span>
                        <ExternalLink className="w-4 h-4" />
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
      {/* MODAL 2: LOGIN & REGISTRATION MODAL (CONDITIONAL RESIDENCY TOGGLE)  */}
      {/* =================================================================== */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setAuthModal({ ...authModal, open: false })}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAuthModal({ ...authModal, open: false })}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
              <button
                type="button"
                onClick={() => setAuthModal({ open: true, tab: 'login' })}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                  authModal.tab === 'login'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthModal({ open: true, tab: 'register' })}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                  authModal.tab === 'register'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Register
              </button>
            </div>

            {authModal.tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Welcome Back to Scholars Sathi
                </h3>
                <p className="text-xs text-slate-500">
                  Connects to{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">
                    POST /api/auth/login
                  </code>
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                >
                  Sign In & Load Profile
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <h3 className="text-2xl font-extrabold text-slate-900">Create Student Account</h3>
                <p className="text-xs text-slate-500">
                  Connects to{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">
                    POST /api/auth/register
                  </code>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Priya Sharma"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="priya@college.edu"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                {/* Residency / Nationality Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nationality / Residency
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
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
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600'
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
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      🌍 Outside India
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  {/* Category appears ONLY when Indian Citizen is selected */}
                  {registerForm.nationality === 'Indian' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Social Category
                      </label>
                      <select
                        value={registerForm.category}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                      <select
                        value={registerForm.state}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, state: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                  } gap-3`}
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Income (₹/yr)
                    </label>
                    <input
                      type="number"
                      required
                      value={registerForm.income}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, income: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  {registerForm.nationality === 'Indian' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <select
                        value={registerForm.state}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, state: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Marks (%)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={registerForm.marks}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, marks: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Level
                  </label>
                  <select
                    value={registerForm.course}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, course: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                >
                  Register & Match Scholarships
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Edit Academic & Financial Profile
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Updates your profile & immediately recalculates ML eligibility scores.
            </p>

            <form onSubmit={handleProfileSave} className="space-y-4">
              {/* Nationality Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nationality / Residency
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
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
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600'
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
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    🌍 Outside India
                  </button>
                </div>
              </div>

              <div
                className={`grid ${
                  profileForm.nationality === 'Indian' ? 'grid-cols-2' : 'grid-cols-1'
                } gap-3`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                {profileForm.nationality === 'Indian' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Social Category
                    </label>
                    <select
                      value={profileForm.category}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Family Income (₹)
                  </label>
                  <input
                    type="number"
                    value={profileForm.income}
                    onChange={(e) => setProfileForm({ ...profileForm, income: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {profileForm.nationality === 'Indian' ? 'Home State' : 'Region'}
                  </label>
                  <select
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qualifying Marks (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={profileForm.marks}
                    onChange={(e) => setProfileForm({ ...profileForm, marks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Level
                  </label>
                  <select
                    value={profileForm.course}
                    onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Save Profile & Recalculate ML Scores
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: LIVE API ENDPOINT CONFIGURATION MODAL                      */}
      {/* =================================================================== */}
      {apiConfigModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setApiConfigModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setApiConfigModalOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Backend & ML API Integration
                </h3>
                <p className="text-xs text-slate-500">
                  Configure your live Backend REST API & Python ML Model API endpoints
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveApiConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Backend Server Base URL (Auth, Profile, Scholarships DB)
                </label>
                <input
                  type="url"
                  value={cfgForm.backendUrl}
                  onChange={(e) => setCfgForm({ ...cfgForm, backendUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  placeholder="http://localhost:5000/api"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Routes used: <code>/auth/login</code>, <code>/auth/register</code>,{' '}
                  <code>/student/profile</code>, <code>/scholarships</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ML Model API Base URL (Predictions & AI Explanations)
                </label>
                <input
                  type="url"
                  value={cfgForm.mlUrl}
                  onChange={(e) => setCfgForm({ ...cfgForm, mlUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  placeholder="http://localhost:8000/ml"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Routes used: <code>/predict-eligibility</code>, <code>/explain-match</code>
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>Expected ML Response Schema:</strong>
                <pre className="mt-1.5 text-[11px] overflow-x-auto text-slate-800">
                  {`{ "predictions": [{ "scholarshipId": 1, "matchScore": 94, "status": "ELIGIBLE", "aiReason": "...", "criteriaBreakdown": [...] }] }`}
                </pre>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                Save Endpoints & Test Connection
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}