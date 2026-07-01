import { useState, useRef } from 'react';
import authService from '../../services/authService';
import activityLogService from '../../services/activityLogService';
import { Save, User, Mail, Phone, Lock, Camera, Shield } from 'lucide-react';
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
  const [user, setUser] = useState(authUser);

  const initialName = authUser ? authUser.fullName : activeRoleData.userName;
  const initialEmail = authUser ? authUser.email : activeRoleData.userEmail;
  const initialMobile = authUser ? authUser.mobile : '+91 9876543210';
  const initialImage = authUser?.profileImage || null;

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [mobile, setMobile] = useState(initialMobile);
  const [profileImage, setProfileImage] = useState<string | null>(initialImage);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return alert('Only JPG, JPEG, and PNG formats are supported.');
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

  const handleSave = () => {
    // Profile Information Validation
    if (!name.trim()) return alert("Full Name is required.");
    if (!/^\+?[0-9\s\-]{10,15}$/.test(mobile)) return alert("Please enter a valid mobile number.");

    // Password Validation
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) return alert("Please enter your current password to change it.");
      const existingPassword = authService.getCurrentUser()?.password || "";
      if (currentPassword !== existingPassword) return alert("Current password does not match.");
      
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        return alert("New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
      }
      if (newPassword !== confirmPassword) return alert("Confirm password does not match the new password.");
    }
    
    const updatedUser = {
      ...authUser,
      fullName: name,
      email,
      mobile,
      profileImage,
      password: newPassword || authUser?.password || "Password123!",
    };

    // 1. Update overall profile management database state
    authService.updateProfile(updatedUser);

    // 2. Sync the active session token/object in localStorage
    localStorage.setItem('authUser', JSON.stringify(updatedUser));

    // 3. Update component state safely
    setUser(updatedUser);
    
    activityLogService.addLog({
      userId: updatedUser?.id,
      userName: updatedUser?.fullName,
      action: newPassword ? "Updated Profile & Password" : "Updated Profile",
      module: "Profile Settings",
    });

    if (newPassword) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    alert(newPassword ? "Profile and password updated successfully." : "Profile updated successfully.");
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal information and account security."
        actions={
          <ActionButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>Save Changes</ActionButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Avatar Section */}
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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg" 
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold mt-2">
              <Shield className="w-3 h-3" /> {activeRoleData.title}
            </span>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Update your photo and personal details here.
            </p>
          </div>
        </div>

        {/* Form Section */}
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
                    readOnly
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 focus:outline-none text-sm cursor-not-allowed"
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
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}