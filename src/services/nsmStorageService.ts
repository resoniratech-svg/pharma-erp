import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage Keys for NSM Module
const KEYS = {
  TARGET_PLANNING: '@nsm_target_planning',
  RECENT_TARGET_PLANS: '@nsm_recent_target_plans',
  RSM_LIST: '@nsm_rsm_list',
  STATE_PERFORMANCE: '@nsm_state_performance',
  TEAM_VISITS: '@nsm_team_visits',
  SETTINGS: '@nsm_settings',
};

// Initial Mock Seed Data
const INITIAL_RSM_LIST = [
  { id: '1', code: 'RSM001', name: 'Arun Kumar', state: 'Maharashtra', hq: 'Mumbai', status: 'Active' },
  { id: '2', code: 'RSM002', name: 'Rajesh Singh', state: 'Gujarat', hq: 'Ahmedabad', status: 'Active' },
  { id: '3', code: 'RSM003', name: 'Priya Sharma', state: 'Karnataka', hq: 'Bangalore', status: 'Active' },
];

const INITIAL_TARGET_PLANNING = {
  financialYear: '2026-27',
  planningPeriod: 'Annual',
  nationalTargetInput: '10000000',
  targetType: 'Sales Value',
  startDate: '01-04-2026',
  endDate: '31-03-2027',
  remarks: 'Pan-India Annual Allocation FY 2026-27',
  allocations: [
    { id: '1', code: 'RSM001', name: 'Arun Kumar', state: 'Maharashtra', prevTarget: '₹1,20,00,000', currAchv: '85%', allocatedTarget: '12000000', status: 'Pending' },
    { id: '2', code: 'RSM002', name: 'Rajesh Singh', state: 'Gujarat', prevTarget: '₹1,50,00,000', currAchv: '92%', allocatedTarget: '15000000', status: 'Pending' },
    { id: '3', code: 'RSM003', name: 'Priya Sharma', state: 'Karnataka', prevTarget: '₹1,10,00,000', currAchv: '88%', allocatedTarget: '11000000', status: 'Pending' },
  ],
};

const INITIAL_SETTINGS = {
  pushNotif: true,
  emailNotif: true,
  autoApproval: false,
};

// ── Target Planning Methods ──
export const getTargetPlanningData = async () => {
  try {
    const json = await AsyncStorage.getItem(KEYS.TARGET_PLANNING);
    return json != null ? JSON.parse(json) : INITIAL_TARGET_PLANNING;
  } catch (e) {
    console.error('Error reading target planning data', e);
    return INITIAL_TARGET_PLANNING;
  }
};

export const saveTargetPlanningData = async (data: any) => {
  try {
    await AsyncStorage.setItem(KEYS.TARGET_PLANNING, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving target planning data', e);
    return false;
  }
};

const INITIAL_RECENT_PLANS = [
  { id: '1', fy: '2026-27', period: 'Annual', created: '2026-04-01', status: 'Active', allocated: '₹0', remaining: '₹10,00,000' }
];

export const getRecentTargetPlans = async () => {
  try {
    const json = await AsyncStorage.getItem(KEYS.RECENT_TARGET_PLANS);
    return json != null ? JSON.parse(json) : INITIAL_RECENT_PLANS;
  } catch (e) {
    console.error('Error reading recent target plans', e);
    return INITIAL_RECENT_PLANS;
  }
};

export const addRecentTargetPlan = async (newPlan: any) => {
  try {
    const current = await getRecentTargetPlans();
    const updated = [newPlan, ...current];
    await AsyncStorage.setItem(KEYS.RECENT_TARGET_PLANS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error adding recent target plan', e);
    return null;
  }
};

// ── RSM List Methods ──
export const getRSMList = async () => {
  try {
    const json = await AsyncStorage.getItem(KEYS.RSM_LIST);
    return json != null ? JSON.parse(json) : INITIAL_RSM_LIST;
  } catch (e) {
    console.error('Error reading RSM list', e);
    return INITIAL_RSM_LIST;
  }
};

export const saveRSMList = async (list: any[]) => {
  try {
    await AsyncStorage.setItem(KEYS.RSM_LIST, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Error saving RSM list', e);
    return false;
  }
};

export const addRSMRecord = async (newRSM: any) => {
  try {
    const current = await getRSMList();
    const updated = [newRSM, ...current];
    await saveRSMList(updated);
    return updated;
  } catch (e) {
    console.error('Error adding RSM record', e);
    return null;
  }
};

// ── Settings Methods ──
export const getNSMSettings = async () => {
  try {
    const json = await AsyncStorage.getItem(KEYS.SETTINGS);
    return json != null ? JSON.parse(json) : INITIAL_SETTINGS;
  } catch (e) {
    console.error('Error reading settings', e);
    return INITIAL_SETTINGS;
  }
};

export const saveNSMSettings = async (settings: any) => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Error saving settings', e);
    return false;
  }
};
