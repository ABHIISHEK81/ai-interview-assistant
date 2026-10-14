import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Star, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Eye, 
  Briefcase, 
  GraduationCap, 
  Code 
} from 'lucide-react';
import api from '../services/api';

export default function ResumeManagerPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inspectResume, setInspectResume] = useState(null);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.resumes || res.data.data || []);
    } catch (err) {
      console.warn('Failed to load resumes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Only PDF resumes are supported. Please select a .pdf file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Resume uploaded and parsed successfully by AI!');
      setSelectedFile(null);
      await fetchResumes();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to upload and parse resume.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      await api.patch(`/resumes/${resumeId}/default`);
      await fetchResumes();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to set default resume.';
      setError(msg);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm('Are you sure you want to remove this resume?')) return;
    try {
      await api.delete(`/resumes/${resumeId}`);
      await fetchResumes();
      if (inspectResume?._id === resumeId) setInspectResume(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to delete resume.';
      setError(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5 font-heading">
            <FileText className="w-7 h-7 text-[#6366F1]" />
            Resume Manager & AI Skill Extraction
          </h1>
          <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
            Upload your PDF resume. Our RAG engine extracts and vectorizes your projects and skills to generate high-fidelity interview questions.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[#10B981] text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981]" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Box (1 col) */}
        <div className="card-saas rounded-2xl p-6 h-fit border-[#334155] bg-[#1E293B]">
          <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center gap-2 font-heading">
            <Upload className="w-4 h-4 text-[#06B6D4]" />
            Upload New Resume (PDF)
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <label className="border-2 border-dashed border-[#334155] hover:border-[#6366F1]/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0F172A] group text-center">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-[#6366F1] mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-300">
                {selectedFile ? selectedFile.name : 'Click to select PDF or drag & drop'}
              </span>
              <span className="text-[10px] text-[#94A3B8] mt-1">
                Max 5MB • Standard PDF format
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-primary-gradient text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Parsing with Groq LLaMA 3.3...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>Upload & Extract Skills</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-[#0F172A] border border-[#334155] text-[11px] text-[#94A3B8] leading-relaxed">
            <strong className="text-slate-300 block mb-1">RAG Grounding Guarantee:</strong>
            Uploaded resumes are classified into discrete sections (Skills, Work Experience, Education) so mock interview questions mirror real technical challenges you've faced.
          </div>
        </div>

        {/* Resumes List & Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-saas rounded-2xl p-6 border-[#334155] bg-[#1E293B]">
            <h3 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center justify-between font-heading">
              <span>Your Uploaded Resumes ({resumes.length})</span>
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading your resumes...</div>
            ) : resumes.length === 0 ? (
              <div className="py-10 text-center text-[#94A3B8] space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs">No resumes uploaded yet. Upload your first PDF to enable personalized RAG interview generation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((r) => (
                  <div
                    key={r._id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      r.isDefault 
                        ? 'bg-[#0F172A] border-[#6366F1]/50 shadow-md shadow-indigo-950/30' 
                        : 'bg-[#0F172A] border-[#334155] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center shrink-0 text-[#6366F1]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#F8FAFC] text-sm">
                            {r.originalName}
                          </h4>
                          {r.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#94A3B8] flex items-center gap-3 mt-1 font-mono">
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{r.parsedData?.skills?.length || 0} skills detected</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setInspectResume(r)}
                        className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span>Inspect</span>
                      </button>

                      {!r.isDefault && (
                        <button
                          onClick={() => handleSetDefault(r._id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>Make Default</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(r._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Skill & Data Drawer if selected */}
          {inspectResume && (
            <div className="card-saas rounded-2xl p-6 border-[#06B6D4]/40 bg-[#1E293B] animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-[#334155] mb-4">
                <div>
                  <h4 className="font-bold text-[#F8FAFC] text-base flex items-center gap-2 font-heading">
                    <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                    Parsed Metadata: {inspectResume.originalName}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Extracted via Groq LLaMA 3.3 70B Versatile
                  </p>
                </div>
                <button
                  onClick={() => setInspectResume(null)}
                  className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Close
                </button>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] mb-2 flex items-center gap-1.5 font-heading">
                    <Code className="w-3.5 h-3.5 text-indigo-400" /> Extracted Skills
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectResume.parsedData?.skills?.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-[#0F172A] text-xs font-medium text-indigo-300 border border-[#334155]">
                        {skill}
                      </span>
                    )) || <span className="text-xs text-slate-500">None detected</span>}
                  </div>
                </div>

                {/* Experience Highlights */}
                {inspectResume.parsedData?.experience && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] mb-2 flex items-center gap-1.5 font-heading">
                      <Briefcase className="w-3.5 h-3.5 text-[#06B6D4]" /> Experience Highlights
                    </h5>
                    <div className="space-y-2 text-xs text-slate-300">
                      {inspectResume.parsedData.experience.map((exp, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#0F172A] border border-[#334155]">
                          <div className="font-bold text-[#F8FAFC]">{exp.role} • {exp.company}</div>
                          <div className="text-[11px] text-[#94A3B8]">{exp.duration}</div>
                          {exp.description && <p className="text-[#94A3B8] mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {inspectResume.parsedData?.education && (
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] mb-2 flex items-center gap-1.5 font-heading">
                      <GraduationCap className="w-3.5 h-3.5 text-[#6366F1]" /> Education
                    </h5>
                    <div className="space-y-2 text-xs text-slate-300">
                      {inspectResume.parsedData.education.map((edu, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#0F172A] border border-[#334155]">
                          <span className="font-semibold text-[#F8FAFC]">{edu.degree}</span> - {edu.institution} ({edu.year})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
