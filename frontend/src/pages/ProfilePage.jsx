import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateProfile, fetchMe } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setTargetRole(user.targetRole || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });

    const res = await updateProfile({ name, bio, targetRole });
    setSavingProfile(false);

    if (res.success) {
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile.', type: 'error' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setChangingPass(true);
    try {
      await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.error || 'Password update failed.', type: 'error' });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-400" />
          Profile & Account Settings
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your personal candidate information, target engineering roles, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Account Summary (1 col) */}
        <div className="glass-panel rounded-2xl p-6 h-fit space-y-5 border-slate-800">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[2px] mb-3 shadow-lg shadow-indigo-600/30">
              <div className="w-full h-full bg-[#090d1a] rounded-full flex items-center justify-center text-2xl font-black text-white uppercase">
                {user?.name ? user.name[0] : 'U'}
              </div>
            </div>
            <h3 className="font-bold text-white text-base">{user?.name || 'Candidate'}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
              {user?.role || 'candidate'}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Credits Remaining:</span>
              <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> {user?.credits ?? 2}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Plan:</span>
              <span className="font-semibold text-white capitalize">{user?.plan || 'Free'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member Since:</span>
              <span className="font-mono text-slate-400">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Forms (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Candidate Profile Information
            </h3>

            {profileMsg.text && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/60 border border-red-500/40 text-red-300'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Target Engineering Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Professional Bio / Summary
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief overview of your background, core tech stack, and career goals..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              Change Password
            </h3>

            {passwordMsg.text && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success' 
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/60 border border-red-500/40 text-red-300'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{changingPass ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
