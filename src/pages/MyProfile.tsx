import { motion } from 'framer-motion';
import { User, Mail, Phone, Briefcase, Building2, Calendar, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { ROLE_SUPER_ADMIN, ROLES } from '../constants/roles';

export default function MyProfile() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const authUserString = localStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const displayName = authUser ? authUser.fullName : activeRoleData.userName;
  const displayEmail = authUser ? authUser.email : activeRoleData.userEmail;
  const displayMobile = authUser ? authUser.mobile : '+91 98765 43210';
  const displayEmployeeCode = authUser ? authUser.employeeCode : 'EMP-2049';
  const displayDepartment = authUser ? authUser.department : 'Operations & Logistics';

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal and organizational information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Photo */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 text-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg mb-4 relative">
              <User className="w-10 h-10" />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
            <p className="text-sm font-medium text-primary mt-1">{activeRoleData.title}</p>
            <p className="text-xs text-slate-500 mt-2">{displayEmail}</p>

            <div className="w-full h-px bg-slate-100 my-6" />

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Account Status</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Employee Code</span>
                <span className="font-semibold text-slate-700">{displayEmployeeCode}</span>
              </div>
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
                <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-100 bg-white shadow-sm ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-slate-800 text-xs">Login Successful</div>
                    <time className="text-[10px] font-medium text-slate-500">Today, 09:30 AM</time>
                  </div>
                  <div className="text-slate-500 text-xs">IP: 192.168.1.45 (Mumbai)</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-100 bg-slate-50 shadow-sm ml-4 md:ml-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-slate-800 text-xs">Settings Updated</div>
                    <time className="text-[10px] font-medium text-slate-500">Yesterday</time>
                  </div>
                  <div className="text-slate-500 text-xs">Notification preferences changed</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-slate-800">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="text-sm font-medium text-slate-900">{displayName}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Gender</label>
                <div className="text-sm font-medium text-slate-900">Male</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Date of Birth</label>
                <div className="text-sm font-medium text-slate-900">12th August, 1988</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Primary Contact</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {displayMobile}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Registered Email</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {displayEmail}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
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
                  Suresh Reddy (Director)
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Assigned Location</label>
                <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Central Hub, Mumbai, Maharashtra 400001
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
