import { useState, useRef } from 'react';
import authService from '../../services/authService';
import activityLogService from '../../services/activityLogService';
import { 
  Save, User, Mail, Phone, Lock, Camera, Shield, 
  FileText, Building2, CreditCard, QrCode, Upload, Trash2, MapPin, CheckCircle2,
  BadgeCheck, AlertCircle
} from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';
import { ROLE_SUPER_ADMIN, ROLES } from '../../constants/roles';

export default function ProfileSettings() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const authUserString = localStorage.getItem('authUser');
  const authUser = authUserString ? JSON.parse(authUserString) : null;
  const [, setUser] = useState(authUser);

  // Load extended meta (GST, Address, License, UPI, Scanner QR, User Code)
  const userMetaMap: Record<string, any> = {};
  try {
    const storedMeta = localStorage.getItem('pharma_users_extended_meta');
    if (storedMeta) Object.assign(userMetaMap, JSON.parse(storedMeta));
  } catch (_) {}

  const userMeta = (authUser ? (userMetaMap[authUser.email?.toLowerCase()] || userMetaMap[String(authUser.id)] || {}) : {});

  const initialName = authUser?.fullName || activeRoleData.userName;
  const initialEmail = authUser?.email || activeRoleData.userEmail;
  const initialMobile = authUser?.mobile || userMeta.mobile || '+91 9876543210';
  const initialImage = authUser?.profileImage || null;
  const initialEmployeeCode = authUser?.employeeCode || userMeta.empId || 'EMP-001';
  const initialGstNumber = authUser?.gstNumber || userMeta.gstNumber || '';
  const initialLicenseNumber = authUser?.licenseNumber || userMeta.licenseNumber || '';
  const initialAddress = authUser?.address || userMeta.address || '';
  const initialUpiId = authUser?.upiId || userMeta.upiId || '';
  const initialUpiQrScanner = authUser?.upiQrScanner || userMeta.upiQrScanner || null;

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [mobile, setMobile] = useState(initialMobile);
  const [employeeCode] = useState(initialEmployeeCode);
  const [gstNumber, setGstNumber] = useState(initialGstNumber);
  const [licenseNumber, setLicenseNumber] = useState(initialLicenseNumber);
  const [address, setAddress] = useState(initialAddress);
  const [upiId, setUpiId] = useState(initialUpiId);
  const [upiQrScanner, setUpiQrScanner] = useState<string | null>(initialUpiQrScanner);
  const [profileImage, setProfileImage] = useState<string | null>(initialImage);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      return alert('Only JPG, JPEG, PNG, and WEBP formats are supported.');
    }

    if (file.size > 2 * 1024 * 1024) {
      return alert('Maximum file size is 2 MB.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
      activityLogService.addLog({
        userId: authUser?.id,
        userName: authUser?.fullName,
        action: "Updated Profile Photo",
        module: "Profile Settings",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      return alert('Only JPG, JPEG, PNG, and WEBP formats are supported for QR scanner.');
    }

    if (file.size > 5 * 1024 * 1024) {
      return alert('Maximum file size is 5 MB.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUpiQrScanner(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Profile Information Validation
    if (!name.trim()) return alert("Full Name is required.");
    if (mobile && !/^\+?[0-9\s\-]{10,15}$/.test(mobile)) return alert("Please enter a valid mobile number.");

    // Password Validation
    if (newPassword) {
      if (!currentPassword) return alert("Please enter your current password to change it.");
      
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        return alert("New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
      }
      if (newPassword !== confirmPassword) return alert("Confirm password does not match the new password.");
    }
  
    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        profileImage,
        currentPassword,
        newPassword,
        gstNumber: gstNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        address: address.trim(),
        upiId: upiId.trim(),
        upiQrScanner
      });

      // Persist extended metadata in localStorage
      const storedMeta = JSON.parse(localStorage.getItem('pharma_users_extended_meta') || '{}');
      const updatedMeta = {
        empId: employeeCode,
        gstNumber: gstNumber.trim(),
        address: address.trim(),
        licenseNumber: licenseNumber.trim(),
        upiId: upiId.trim(),
        upiQrScanner
      };
      if (email) storedMeta[email.trim().toLowerCase()] = updatedMeta;
      if (authUser?.id) storedMeta[String(authUser.id)] = updatedMeta;
      if (employeeCode) storedMeta[employeeCode.trim()] = updatedMeta;
      localStorage.setItem('pharma_users_extended_meta', JSON.stringify(storedMeta));

      // Update in users table if exists
      try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = storedUsers.findIndex((u: any) => 
          (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
          (authUser?.id && String(u.id) === String(authUser.id))
        );
        if (idx !== -1) {
          storedUsers[idx] = {
            ...storedUsers[idx],
            name: name.trim(),
            fullName: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            gstNumber: gstNumber.trim(),
            address: address.trim(),
            licenseNumber: licenseNumber.trim(),
            upiId: upiId.trim(),
            upiQrScanner,
            profileImage
          };
          localStorage.setItem('users', JSON.stringify(storedUsers));
        }
      } catch (_) {}

      if (updatedUser) {
        setUser(updatedUser);

        activityLogService.addLog({
          userId: updatedUser.id,
          userName: updatedUser.fullName,
          action: newPassword ? "Updated Profile & Password" : "Updated Profile Settings",
          module: "Profile Settings",
        });

        if (newPassword) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update profile.");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal profile, tax compliance, UPI settlement details, and account security."
        actions={
          <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Save Changes
          </ActionButton>
        }
      />

      {saveSuccess && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Profile settings and compliance details updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Left Column: Avatar & Summary Card */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div 
              className="relative group cursor-pointer mb-4"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">{name}</h3>
            
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
              <Shield className="w-3.5 h-3.5" /> {activeRoleData.title}
            </span>

            {employeeCode && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-mono font-bold mt-2">
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" /> {employeeCode}
              </span>
            )}

            <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
              Click photo to change avatar. Supported formats: JPG, PNG, WEBP (Max 2MB).
            </p>

            <div className="w-full h-px bg-slate-100 my-4" />

            {/* Quick Profile Summary */}
            <div className="w-full space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]" title={email}>{email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-medium text-slate-800">{mobile || '-'}</span>
              </div>
              {gstNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-800">{gstNumber}</span>
                </div>
              )}
              {upiId && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-mono font-semibold text-violet-700">{upiId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form Sections */}
        <div className="col-span-2 space-y-6">
          
          {/* Card 1: Personal Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>User / Employee Code</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Auto-Generated</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BadgeCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={employeeCode}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm font-mono font-bold cursor-not-allowed select-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Compliance & Legal Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Compliance & Legal Details</h3>
                <p className="text-xs text-slate-500">Used on invoices, tax filings, and trade verification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  GST Number (GSTIN)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-mono uppercase tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  License Number (Drug / Trade)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-20B/21B-87654"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Registered Address
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Complete business/residential address, Street, City, State, PIN Code"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Payment & UPI Settlement Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment & UPI Settlement</h3>
                <p className="text-xs text-slate-500">Configure your UPI ID and payment scanner QR code for quick settlements.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  UPI ID (VPA)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. merchant@okhdfcbank or 9876543210@upi"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload UPI QR Scanner
                </label>
                
                {upiQrScanner ? (
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-sm">
                        <img 
                          src={upiQrScanner} 
                          alt="UPI QR Scanner" 
                          className="w-full h-full object-contain rounded" 
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> QR Code Active
                        </div>
                        <p className="text-xs text-slate-500">Displayed on payment receipts and invoices.</p>
                        <button
                          type="button"
                          onClick={() => qrInputRef.current?.click()}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline mt-1.5"
                        >
                          Replace QR Image
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUpiQrScanner(null)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove QR code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => qrInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      Click to upload UPI Scanner / QR Code
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={qrInputRef}
                  onChange={handleQrUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Security Settings */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Security & Password</h3>
                <p className="text-xs text-slate-500">Leave blank if you do not want to change your password.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 chars (1 upper, 1 special)"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex justify-end pt-2 pb-6">
            <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>
              Save All Changes
            </ActionButton>
          </div>

        </div>
      </div>
    </div>
  );
}
