// import { useState } from 'react';
// import { Save, User, Mail, Phone, Lock, Camera, Shield } from 'lucide-react';
// import {
//   PageHeader,
//   ActionButton,
// } from './components/shared';
// import { ROLE_SUPER_ADMIN, ROLES } from '../../constants/roles';

// export default function ProfileSettings() {
//   const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
//   const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
//   const authUserString = localStorage.getItem('authUser');
//   const authUser = authUserString ? JSON.parse(authUserString) : null;
//   const displayName = authUser ? authUser.fullName : activeRoleData.userName;
//   const displayEmail = authUser ? authUser.email : activeRoleData.userEmail;
//   const displayMobile = authUser ? authUser.mobile : '+91 9876543210';

//   const [name, setName] = useState(displayName);
//   const [email, setEmail] = useState(displayEmail);
//   const [mobile, setMobile] = useState(displayMobile);
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');

//   return (
//     <div className="animate-in fade-in duration-500 max-w-4xl">
//       <PageHeader
//         title="Profile Settings"
//         subtitle="Manage your personal information and account security."
//         actions={
//           <ActionButton icon={<Save className="w-4 h-4" />}>Save Changes</ActionButton>
//         }
//       />

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
//         {/* Avatar Section */}
//         <div className="col-span-1">
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
//             <div className="relative group cursor-pointer mb-4">
//               <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
//                 <User className="w-16 h-16 text-slate-400" />
//               </div>
//               <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                 <Camera className="w-8 h-8 text-white" />
//               </div>
//             </div>
//             <h3 className="text-lg font-bold text-slate-900">{name}</h3>
//             <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold mt-2">
//               <Shield className="w-3 h-3" /> {activeRoleData.title}
//             </span>
//             <p className="text-sm text-slate-500 mt-2 text-center">
//               Update your photo and personal details here.
//             </p>
//           </div>
//         </div>

//         {/* Form Section */}
//         <div className="col-span-2 space-y-6">
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Personal Information</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <User className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Mail className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Phone className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="tel"
//                     value={mobile}
//                     onChange={(e) => setMobile(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Security Settings</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="password"
//                     value={currentPassword}
//                     onChange={(e) => setCurrentPassword(e.target.value)}
//                     placeholder="Enter current password"
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="password"
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                     placeholder="Enter new password"
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


////////////////////////////////////////////////////////////////////////


import { useState, useRef } from 'react';
import { Save, User, Mail, Phone, Lock, Camera, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  PageHeader,
  ActionButton,
} from './components/shared';
import { ROLE_SUPER_ADMIN, ROLES } from '../../constants/roles';

export default function ProfileSettings() {
  const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
  const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  
  let authUser = null;
  const authUserString = localStorage.getItem('authUser');
  if (authUserString) {
    try {
      authUser = JSON.parse(authUserString);
    } catch (e) {
      console.error('Invalid JSON in localStorage for authUser');
    }
  }
  
  const [localAuthUser, setLocalAuthUser] = useState(authUser);
  
  const displayName = localAuthUser?.fullName || activeRoleData.userName;
  const displayEmail = localAuthUser?.email || activeRoleData.userEmail;
  const displayMobile = localAuthUser?.mobile || '+91 9876543210';

  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(displayEmail);
  const [mobile, setMobile] = useState(displayMobile);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(localAuthUser?.profileImage || null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const hasChanges = 
    name !== displayName || 
    email !== displayEmail || 
    mobile !== displayMobile || 
    currentPassword.length > 0 || 
    newPassword.length > 0 ||
    confirmPassword.length > 0 ||
    profileImage !== (localAuthUser?.profileImage || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setMessage({ type: 'error', text: 'Please select a valid JPG or PNG image.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setMessage(null);
    
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email Address is required.' });
      return;
    }
    if (!mobile.trim()) {
      setMessage({ type: 'error', text: 'Mobile Number is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    let phoneDigits = mobile.replace(/\D/g, '');
    if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
      phoneDigits = phoneDigits.slice(2);
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneDigits)) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }

    const wantsPasswordChange = currentPassword.trim() || newPassword.trim() || confirmPassword.trim();
    
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required to change your password.' });
        return;
      }
      if (newPassword.length < 8) {
        setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match. Please try again.' });
        return;
      }
    }

    try {
      setIsSaving(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedUser = {
        ...localAuthUser,
        fullName: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        profileImage: profileImage,
      };
      
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      setLocalAuthUser(updatedUser);
      
      if (wantsPasswordChange) {
         setCurrentPassword('');
         setNewPassword('');
         setConfirmPassword('');
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Unable to update profile. Please try again later.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal information and account security."
        actions={
          <ActionButton 
            onClick={handleSave} 
            disabled={isSaving || !hasChanges} 
            icon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </ActionButton>
        }
      />

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
          )}
          <div>
            <h3 className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
              {message.type === 'success' ? 'Changes Saved' : 'Validation Error'}
            </h3>
            <p className={`text-sm mt-1 ${message.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div 
              className="relative group cursor-pointer mb-4" 
              onClick={() => fileInputRef.current?.click()}
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
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/png, image/jpeg" 
              className="hidden" 
            />

            <h3 className="text-lg font-bold text-slate-900 text-center">{name || 'Your Name'}</h3>
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold mt-2">
              <Shield className="w-3 h-3" /> {activeRoleData.title}
            </span>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Update your photo and personal details here.
            </p>
            {/* 🛡️ Added Helper Text as recommended by ChatGPT */}
            <p className="text-xs text-slate-400 mt-1 text-center">
              Supported formats: JPG, PNG<br/>
              Maximum size: 2 MB
            </p>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={activeRoleData.title}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////

// import { useState } from 'react';
// import { Save, User, Mail, Phone, Lock, Camera, Shield, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
// import {
//   PageHeader,
//   ActionButton,
// } from './components/shared';
// import { ROLE_SUPER_ADMIN, ROLES } from '../../constants/roles';

// export default function ProfileSettings() {
//   const activeRole = localStorage.getItem('activeRole') || ROLE_SUPER_ADMIN;
//   const activeRoleData = ROLES.find(r => r.id === activeRole) || ROLES[0];
  
//   // 🛡️ Enterprise Feature: Safe JSON parsing to prevent crashes
//   let authUser = null;
//   const authUserString = localStorage.getItem('authUser');
//   if (authUserString) {
//     try {
//       authUser = JSON.parse(authUserString);
//     } catch (e) {
//       console.error('Invalid JSON in localStorage for authUser');
//     }
//   }
  
//   const [localAuthUser, setLocalAuthUser] = useState(authUser);
  
//   const displayName = localAuthUser?.fullName || activeRoleData.userName;
//   const displayEmail = localAuthUser?.email || activeRoleData.userEmail;
//   const displayMobile = localAuthUser?.mobile || '+91 9876543210';

//   const [name, setName] = useState(displayName);
//   const [email, setEmail] = useState(displayEmail);
//   const [mobile, setMobile] = useState(displayMobile);
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

//   // 🛡️ Enterprise Feature: Password Visibility Toggles
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [isSaving, setIsSaving] = useState(false);
//   const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

//   // Checks if user actually changed anything
//   const hasChanges = 
//     name !== displayName || 
//     email !== displayEmail || 
//     mobile !== displayMobile || 
//     currentPassword.length > 0 || 
//     newPassword.length > 0 ||
//     confirmPassword.length > 0;

//   const handleSave = async () => {
//     setMessage(null);
    
//     // 1. Empty Field Validations
//     if (!name.trim()) {
//       setMessage({ type: 'error', text: 'Full Name is required.' });
//       return;
//     }
//     if (!email.trim()) {
//       setMessage({ type: 'error', text: 'Email Address is required.' });
//       return;
//     }
//     if (!mobile.trim()) {
//       setMessage({ type: 'error', text: 'Mobile Number is required.' });
//       return;
//     }

//     // 2. Email Validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.trim())) {
//       setMessage({ type: 'error', text: 'Please enter a valid email address.' });
//       return;
//     }

//     // 3. Mobile Validation (Safely handles Indian +91 prefix)
//     let phoneDigits = mobile.replace(/\D/g, '');
//     if (phoneDigits.startsWith('91') && phoneDigits.length === 12) {
//       phoneDigits = phoneDigits.slice(2);
//     }
//     const phoneRegex = /^[6-9]\d{9}$/;
//     if (!phoneRegex.test(phoneDigits)) {
//       setMessage({ type: 'error', text: 'Please enter a valid 10-digit Indian mobile number.' });
//       return;
//     }

//     // 4. Conditional Password Validation (Only triggers if they typed in the box)
//     const wantsPasswordChange = currentPassword.trim() || newPassword.trim() || confirmPassword.trim();
    
//     if (wantsPasswordChange) {
//       if (!currentPassword) {
//         setMessage({ type: 'error', text: 'Current password is required to change your password.' });
//         return;
//       }
//       if (newPassword.length < 8) {
//         setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
//         return;
//       }
//       if (newPassword !== confirmPassword) {
//         setMessage({ type: 'error', text: 'New passwords do not match. Please try again.' });
//         return;
//       }
//     }

//     // 5. Save Logic (Uses Try/Catch block ready for backend API)
//     try {
//       setIsSaving(true);
      
//       // Simulate Backend API Call (Waiting for backend teammate)
//       await new Promise(resolve => setTimeout(resolve, 800));

//       const updatedUser = {
//         ...localAuthUser,
//         fullName: name.trim(),
//         email: email.trim(),
//         mobile: mobile.trim(),
//       };
      
//       localStorage.setItem('authUser', JSON.stringify(updatedUser));
//       setLocalAuthUser(updatedUser);
      
//       // Only clear passwords if they successfully changed them
//       if (wantsPasswordChange) {
//          setCurrentPassword('');
//          setNewPassword('');
//          setConfirmPassword('');
//       }
      
//       setMessage({ type: 'success', text: 'Profile updated successfully.' });
      
//       setTimeout(() => setMessage(null), 3000);
      
//     } catch (error) {
//       setMessage({ type: 'error', text: 'Unable to update profile. Please try again later.' });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="animate-in fade-in duration-500 max-w-4xl">
//       <PageHeader
//         title="Profile Settings"
//         subtitle="Manage your personal information and account security."
//         actions={
//           <ActionButton 
//             onClick={handleSave} 
//             disabled={isSaving || !hasChanges} 
//             icon={<Save className="w-4 h-4" />}
//           >
//             {isSaving ? 'Saving...' : 'Save Changes'}
//           </ActionButton>
//         }
//       />

//       {message && (
//         <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
//           message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
//         }`}>
//           {message.type === 'success' ? (
//             <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
//           ) : (
//             <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
//           )}
//           <div>
//             <h3 className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
//               {message.type === 'success' ? 'Changes Saved' : 'Validation Error'}
//             </h3>
//             <p className={`text-sm mt-1 ${message.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
//               {message.text}
//             </p>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
//         {/* Avatar Section */}
//         <div className="col-span-1">
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
//             <div className="relative group cursor-pointer mb-4">
//               <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
//                 <User className="w-16 h-16 text-slate-400" />
//               </div>
//               <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                 <Camera className="w-8 h-8 text-white" />
//               </div>
//             </div>
//             <h3 className="text-lg font-bold text-slate-900 text-center">{name || 'Your Name'}</h3>
//             <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold mt-2">
//               <Shield className="w-3 h-3" /> {activeRoleData.title}
//             </span>
//             <p className="text-sm text-slate-500 mt-2 text-center">
//               Update your photo and personal details here.
//             </p>
//           </div>
//         </div>

//         {/* Form Section */}
//         <div className="col-span-2 space-y-6">
//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Personal Information</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <User className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Mail className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Phone className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="tel"
//                     value={mobile}
//                     onChange={(e) => setMobile(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Employee Role</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Shield className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type="text"
//                     value={activeRoleData.title}
//                     disabled
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed text-sm font-medium"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
//             <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">Security Settings</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type={showCurrentPassword ? "text" : "password"}
//                     autoComplete="new-password" // 🛡️ Stops the browser from auto-filling
//                     value={currentPassword}
//                     onChange={(e) => setCurrentPassword(e.target.value)}
//                     placeholder="Enter current password"
//                     className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                   {/* 🛡️ Eye Icon Toggle Button */}
//                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                     <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
//                       {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type={showNewPassword ? "text" : "password"}
//                     autoComplete="new-password"
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                     placeholder="Enter new password (min. 8 characters)"
//                     className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                     <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
//                       {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Lock className="w-4 h-4 text-slate-400" />
//                   </div>
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     autoComplete="new-password"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     placeholder="Confirm new password"
//                     className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
//                   />
//                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
//                       {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }