import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { seedUsers } from '../data/seedUsers';
import activityLogService from '../services/activityLogService';

export default function CentralLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    // 1. Try Super Admin (Platform)
    const storedUsers = localStorage.getItem('users');
    let users = storedUsers ? JSON.parse(storedUsers) : null;
    if (!users || users.length === 0) {
      users = seedUsers;
      localStorage.setItem('users', JSON.stringify(seedUsers));
    }

    let authPayload: any = null;
    let user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user && user.role === 'Super Admin') {
      authPayload = {
        role: 'SUPER_ADMIN',
        tenantId: null,
        purchasedModules: [],
        user
      };
    } else {
      // 2. Try Company Admin (Tenant Admin)
      const storedAdmins = localStorage.getItem('companyAdmins');
      const companyAdmins = storedAdmins ? JSON.parse(storedAdmins) : [];
      const companyAdmin = companyAdmins.find((a: any) => a.email.toLowerCase() === email.toLowerCase() && (a.passwordHash === password || a.password === password));
      
      if (companyAdmin) {
        authPayload = {
          role: 'COMPANY_ADMIN',
          tenantId: companyAdmin.id,
          purchasedModules: companyAdmin.subscription?.purchasedModules || [],
          user: {
            id: companyAdmin.id,
            email: companyAdmin.email,
            fullName: companyAdmin.adminName,
            role: 'COMPANY_ADMIN'
          }
        };
      } else if (user) {
        // 3. Try Tenant User (created via User Management)
        authPayload = {
          role: user.role, // This will be mapped later to actual system role
          tenantId: user.tenantId,
          purchasedModules: user.purchasedModules || [],
          user
        };
      }
    }

    setTimeout(() => {
      setLoading(false);
      if (authPayload) {
        localStorage.setItem('centralAuthSession', JSON.stringify(authPayload));
        navigate('/workspace');
      } else {
        setError('Invalid email or password.');
        activityLogService.addLog({
          userName: email || 'Unknown',
          module: 'Authentication',
          action: 'Failed Login Attempt',
          status: 'Failed'
        });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
        
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h1>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] sm:text-sm transition-colors"
                placeholder="superadmin@pharmaerp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#163c78]/20 focus:border-[#163c78] sm:text-sm transition-colors tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#163c78] focus:ring-[#163c78] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                Remember Me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-semibold text-[#163c78] hover:text-[#102b5c] transition-colors" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#1a365d] hover:bg-[#112440] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a365d] transition-colors mt-2 disabled:opacity-80"
            >
              {loading ? 'Authenticating...' : (
                <>Sign In <span className="ml-2">→</span></>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
