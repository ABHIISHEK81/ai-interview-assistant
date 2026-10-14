import { create } from 'zustand';
import api from '../services/api';

export const useInterviewStore = create((set, get) => ({
  currentInterview: null,
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  streamingFeedback: '',
  isStreaming: false,
  sessionReport: null,
  loading: false,
  error: null,

  setAnswer: (index, text) => {
    set((state) => ({
      answers: { ...state.answers, [index]: text },
    }));
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1, streamingFeedback: '' });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1, streamingFeedback: '' });
    }
  },

  jumpToQuestion: (index) => {
    set({ currentQuestionIndex: index, streamingFeedback: '' });
  },

  setStreamingFeedback: (text) => set({ streamingFeedback: text }),
  setIsStreaming: (bool) => set({ isStreaming: bool }),

  createInterview: async (interviewData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/interviews', interviewData);
      const interview = res.data?.interview || res.data?.data?.interview || res.data?.data || res.data;
      set({ currentInterview: interview });
      return { success: true, interview };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create interview';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  generateQuestions: async (interviewId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/interviews/${interviewId}/generate`);
      const payload = res.data?.data || res.data || {};
      const interview = payload.interview || res.data?.interview || payload;
      const questions = payload.questions || res.data?.questions || interview?.questions || [];
      set({
        currentInterview: interview,
        questions: questions,
        loading: false,
      });
      return { success: true, questions };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to generate questions';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  startSession: async (interviewId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/sessions/start', { interviewId });
      const session = res.data?.session || res.data?.data?.session || res.data?.data || res.data;
      set({
        currentSession: session,
        currentQuestionIndex: 0,
        answers: {},
        streamingFeedback: '',
        sessionReport: null,
        loading: false,
      });
      return { success: true, session };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to start session';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  submitAnswer: async (sessionId, questionIndex, answerText, timeSpentSeconds = 60) => {
    try {
      const res = await api.post(`/sessions/${sessionId}/answer`, {
        questionIndex,
        answer: answerText,
        timeSpentSeconds,
      });
      const session = res.data?.session || res.data?.data?.session || res.data?.data || res.data;
      return { success: true, session };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save answer';
      return { success: false, error: msg };
    }
  },

  completeSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/sessions/${sessionId}/complete`);
      const completedSession = res.data?.session || res.data?.data?.session || res.data?.data || res.data;
      set({
        sessionReport: completedSession,
        currentSession: completedSession,
        loading: false,
      });
      return { success: true, report: completedSession };
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to complete session';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  resetSession: () => {
    set({
      currentInterview: null,
      currentSession: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      streamingFeedback: '',
      isStreaming: false,
      sessionReport: null,
      loading: false,
      error: null,
    });
  },
}));
