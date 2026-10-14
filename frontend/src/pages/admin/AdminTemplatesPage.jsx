import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Sparkles,
  Volume2,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

export default function AdminTemplatesPage() {
  const { adminUser, adminLogout } = useAuthStore();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Form
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('Full Stack Engineer');
  const [level, setLevel] = useState('Senior');
  const [questionCount, setQuestionCount] = useState(5);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/templates');
      setTemplates(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load templates:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMsg('');

    try {
      await api.post('/admin/templates', {
        title,
        role,
        level,
        questionCount: Number(questionCount),
        voiceSettings: {
          rate: Number(voiceSpeed),
          pitch: Number(voicePitch),
        },
      });
      setActionMsg('Interview template created successfully!');
      setShowCreateModal(false);
      setTitle('');
      await fetchTemplates();
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Failed to create template.');
    } finally {
      setSubmitting(false);
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
            <Layers className="w-6 h-6 text-rose-500" />
            Interview Templates & Voice Calibration
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/dashboard" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            Overview
          </Link>
          <Link to="/admin/users" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            User RBAC
          </Link>
          <Link to="/admin/prompts" className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800">
            System Prompts
          </Link>
          <Link to="/admin/templates" className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/30">
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

      {/* Header bar with create action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Pre-Configured Interview Blueprints</h2>
          <p className="text-xs text-slate-400">Standard templates available for quick candidate simulations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl._id} className="glass-panel rounded-2xl p-6 border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase font-mono">
                  {tpl.level || 'Senior'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {tpl.questionCount || 5} Questions
                </span>
              </div>
              <h3 className="font-bold text-white text-base">{tpl.title}</h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Role:</span>
                <span className="font-semibold text-slate-200">{tpl.role}</span>
              </div>

              {tpl.voiceSettings && (
                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rate: {tpl.voiceSettings.rate}x • Pitch: {tpl.voiceSettings.pitch}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono mt-4">
              Created {new Date(tpl.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">New Interview Blueprint</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Blueprint Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. FAANG Senior Frontend Master"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="8">8 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {submitting ? 'Creating...' : 'Create Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
