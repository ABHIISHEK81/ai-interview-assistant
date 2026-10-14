import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Shield, 
  Trash2, 
  Plus, 
  Minus, 
  AlertCircle, 
  CheckCircle2, 
  LogOut,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

export default function AdminUsersPage() {
  const { adminUser, adminLogout } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data?.users || res.data.data || []);
    } catch (err) {
      console.warn('Failed to fetch users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId, updatePayload) => {
    try {
      await api.patch(`/admin/users/${userId}`, updatePayload);
      setActionMsg('User updated successfully.');
      await fetchUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setActionMsg('User account permanently deleted.');
      await fetchUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
              {adminUser?.role || 'super_admin'}
            </span>
            <span className="text-xs text-slate-400 font-mono">{adminUser?.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" />
            Candidate & User Governance Directory
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/dashboard" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            Overview
          </Link>
          <Link to="/admin/users" className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/30">
            User RBAC
          </Link>
          <Link to="/admin/prompts" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            System Prompts
          </Link>
          <Link to="/admin/templates" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            Templates
          </Link>
          <Link
            to="/dashboard"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all flex items-center gap-1.5 ml-1"
            title="Switch to Candidate User Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            User Dashboard
          </Link>
          <button onClick={() => { adminLogout(); navigate('/admin/login'); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 ml-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Search Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Showing {filteredUsers.length} Users
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Candidate / User</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading users directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{u.name || 'Anonymous'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role || 'candidate'}
                        onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="candidate">candidate</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {u.plan || 'free'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-400">{u.credits ?? 2}</span>
                        <button
                          onClick={() => handleUpdateUser(u._id, { credits: (u.credits ?? 2) + 1 })}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-[10px]"
                          title="Add 1 credit"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleUpdateUser(u._id, { credits: Math.max(0, (u.credits ?? 2) - 1) })}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-[10px]"
                          title="Remove 1 credit"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete user account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
