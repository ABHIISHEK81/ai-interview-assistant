import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Terminal, 
  RotateCcw, 
  Save, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  History, 
  LogOut,
  Code,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

export default function AdminPromptsPage() {
  const { adminUser, adminLogout } = useAuthStore();
  const navigate = useNavigate();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState(null);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPrompts = async () => {
    try {
      const res = await api.get('/admin/prompts');
      setPrompts(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load prompts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleSelectPrompt = (p) => {
    setActivePrompt(p);
    setEditedTemplate(p.template);
    setChangeNotes('');
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    if (!activePrompt) return;
    setSubmitting(true);
    setActionMsg('');

    try {
      await api.patch(`/admin/prompts/${activePrompt._id}`, {
        template: editedTemplate,
        changeNotes: changeNotes || 'Updated from admin dashboard',
      });
      setActionMsg('Prompt updated and version incremented successfully!');
      await fetchPrompts();
      setActivePrompt(null);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Failed to update prompt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async (promptId) => {
    if (!window.confirm('Roll back this system prompt to its previous version?')) return;
    try {
      await api.post(`/admin/prompts/${promptId}/rollback`);
      setActionMsg('Prompt rolled back to prior version.');
      await fetchPrompts();
      setActivePrompt(null);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Rollback failed.');
    }
  };

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
            <Terminal className="w-6 h-6 text-rose-500" />
            System Prompts Versioning & Rollback
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/dashboard" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            Overview
          </Link>
          <Link to="/admin/users" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            User RBAC
          </Link>
          <Link to="/admin/prompts" className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/30">
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

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((p) => (
          <div
            key={p._id}
            className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border-slate-800"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 font-mono">
                  {p.category}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  v{p.version}
                </span>
              </div>

              <div className="text-xs text-slate-400 line-clamp-4 font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-900 mb-4 whitespace-pre-wrap">
                {p.template}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                {p.history?.length || 0} history records
              </span>
              <div className="flex items-center gap-2">
                {p.history && p.history.length > 0 && (
                  <button
                    onClick={() => handleRollback(p._id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs"
                    title="Roll back to previous version"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleSelectPrompt(p)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal Drawer */}
      {activePrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-2xl w-full p-6 border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                Edit System Prompt: <span className="uppercase text-indigo-400">{activePrompt.category}</span> (v{activePrompt.version})
              </h3>
              <button onClick={() => setActivePrompt(null)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSavePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Prompt Template Instructions
                </label>
                <textarea
                  value={editedTemplate}
                  onChange={(e) => setEditedTemplate(e.target.value)}
                  rows={10}
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Change Notes (For Audit History)
                </label>
                <input
                  type="text"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="e.g. Added strict technical precision weights and rubric..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePrompt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : 'Save & Bump Version'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
