import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Briefcase, Building2, Calendar, MapPin, 
  Clock, CheckCircle2, FileText, CreditCard, QrCode, Edit3 
} from 'lucide-react';
import { Link } from 'react-router';
import { ROLE_SUPER_ADMIN, ROLES } from '../constants/roles';

export default function MyProfile() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const authUserString = localStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;

  // Load extended metadata (GST, Address, License, UPI, Scanner QR, User Code)
  const userMetaMap: Record<string, any> = {};
  try {
    const storedMeta = localStorage.getItem('pharma_users_extended_meta');
    if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
  } catch (_) {}

  const userMeta = (authUser ? (userMetaMap[authUser.email?.toLowerCase()] || userMetaMap[String(authUser.id)] || {}) : {});

  const displayName = authUser ? authUser.fullName : activeRoleData.userName;
  const displayEmail = authUser ? authUser.email : activeRoleData.userEmail;
  const displayMobile = authUser?.mobile || userMeta.mobile || '+91 98765 43210';
  const displayEmployeeCode = authUser?.employeeCode || userMeta.empId || 'EMP-001';
  const displayDepartment = authUser?.department || 'Operations & Logistics';
  const profileImage = authUser?.profileImage || null;

  const displayGstNumber = authUser?.gstNumber || userMeta.gstNumber || '';
  const displayLicenseNumber = authUser?.licenseNumber || userMeta.licenseNumber || '';
  const displayAddress = authUser?.address || userMeta.address || '';
  const displayUpiId = authUser?.upiId || userMeta.upiId || '';
  const displayUpiQrScanner = authUser?.upiQrScanner || userMeta.upiQrScanner || null;

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Personal identity, business compliance, and account preferences.</p>
        </div>
        <Link
          to="/workspace/settings/profile"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors w-fit"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Quick Info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-4 relative overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
            <p className="text-sm font-semibold text-indigo-600 mt-1">{activeRoleData.title}</p>
            <p className="text-xs text-slate-500 mt-1">{displayEmail}</p>

            <div className="w-full h-px bg-slate-100 my-5" />

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Account Status</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Employee Code</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">{displayEmployeeCode}</span>
              </div>
              {displayGstNumber && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">GSTIN</span>
                  <span className="font-mono font-bold text-slate-700 text-xs">{displayGstNumber}</span>
                </div>
              )}
              {displayUpiId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">UPI ID</span>
                  <span className="font-mono font-bold text-violet-700 text-xs">{displayUpiId}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Recent Activity
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-100 bg-white shadow-sm ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-slate-800 text-xs">Active Session</div>
                    <time className="text-[10px] font-medium text-slate-500">Online</time>
                  </div>
                  <div className="text-slate-500 text-xs">System access authorized</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Personal Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="text-sm font-bold text-slate-900">{displayName}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Employee / User Code</label>
                <div className="text-sm font-mono font-bold text-slate-900">{displayEmployeeCode}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Primary Contact</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {displayMobile}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Registered Email</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {displayEmail}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Organization Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Organization Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Designation / Role</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {activeRoleData.title}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Department</label>
                <div className="text-sm font-medium text-slate-900">{displayDepartment}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Joining Date</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  01-April-2022
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Reporting Manager</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Management / Super Admin
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Compliance & Legal Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Compliance & Legal Details</h3>
              </div>
              <Link 
                to="/workspace/settings/profile" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </Link>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">GST Number (GSTIN)</label>
                <div className="text-sm font-mono font-bold text-slate-900">
                  {displayGstNumber || <span className="text-slate-400 font-normal italic">Not configured</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">License Number</label>
                <div className="text-sm font-mono font-medium text-slate-900">
                  {displayLicenseNumber || <span className="text-slate-400 font-normal italic">Not configured</span>}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Registered Address</label>
                <div className="text-sm font-medium text-slate-800 flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{displayAddress || <span className="text-slate-400 font-normal italic">No address provided</span>}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Payment & UPI Settlement */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Payment & UPI Settlement</h3>
              </div>
              <Link 
                to="/workspace/settings/profile" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </Link>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">UPI ID (VPA)</label>
                <div className="text-sm font-mono font-bold text-violet-700">
                  {displayUpiId || <span className="text-slate-400 font-normal italic">Not configured</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">UPI Scanner (QR Code)</label>
                {displayUpiQrScanner ? (
                  <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 inline-block shadow-sm">
                    <img 
                      src={displayUpiQrScanner} 
                      alt="UPI QR Scanner" 
                      className="max-w-[180px] max-h-[180px] object-contain rounded-lg bg-white p-2" 
                    />
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs">
                    No UPI QR scanner uploaded. You can upload one in <Link to="/workspace/settings/profile" className="text-indigo-600 font-semibold underline">Profile Settings</Link>.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
