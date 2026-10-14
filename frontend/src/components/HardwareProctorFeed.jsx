import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Volume2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function HardwareProctorFeed({ onSpeechTranscript, onHardwareStatusChange }) {
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [permissionState, setPermissionState] = useState('prompting'); // 'prompting' | 'granted' | 'audio-only' | 'denied'
  const [errorMessage, setErrorMessage] = useState('');
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Media Devices on Mount
  const initHardware = async () => {
    setPermissionState('prompting');
    setErrorMessage('');

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('denied');
      setErrorMessage('Your browser does not support camera/microphone WebRTC access. You can proceed with text input.');
      if (onHardwareStatusChange) onHardwareStatusChange({ camera: false, mic: false });
      return;
    }

    try {
      // 1. Attempt Full Camera + Mic Access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      setStream(mediaStream);
      setHasCamera(true);
      setHasMic(true);
      setPermissionState('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setupAudioVisualizer(mediaStream);
      if (onHardwareStatusChange) onHardwareStatusChange({ camera: true, mic: true });
    } catch (err) {
      console.warn('Full AV access failed, attempting audio-only fallback:', err.name, err.message);

      // 2. Fallback to Audio Only if Camera is busy, absent, or denied
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(audioStream);
        setHasCamera(false);
        setHasMic(true);
        setPermissionState('audio-only');
        setupAudioVisualizer(audioStream);
        if (onHardwareStatusChange) onHardwareStatusChange({ camera: false, mic: true });
      } catch (audioErr) {
        console.warn('Microphone access also rejected:', audioErr.name, audioErr.message);
        setPermissionState('denied');
        if (err.name === 'NotAllowedError' || audioErr.name === 'NotAllowedError') {
          setErrorMessage('Camera or Microphone permission was blocked. Click the lock/settings icon in your browser address bar to allow permissions, then click Retry.');
        } else if (err.name === 'NotFoundError' || audioErr.name === 'NotFoundError') {
          setErrorMessage('No camera or microphone hardware found on your system. You can proceed using keyboard answers.');
        } else {
          setErrorMessage('Hardware access error: ' + (audioErr.message || err.message));
        }
        if (onHardwareStatusChange) onHardwareStatusChange({ camera: false, mic: false });
      }
    }
  };

  // Setup Web Audio API volume visualizer
  const setupAudioVisualizer = (mediaStream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Audio visualization unavailable:', e.message);
    }
  };

  // Initialize Speech Recognition (Web Speech API - Zero Cost Native)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const reco = new SpeechRecognition();
      reco.continuous = true;
      reco.interimResults = true;
      reco.lang = 'en-US';

      reco.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript.trim() && onSpeechTranscript) {
          onSpeechTranscript(transcript.trim());
        }
      };

      reco.onerror = (e) => {
        console.warn('Speech recognition notification:', e.error);
        if (e.error === 'not-allowed') {
          setIsListeningSpeech(false);
        }
      };

      reco.onend = () => {
        if (isListeningSpeech) {
          try {
            reco.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = reco;
    }

    initHardware();

    return () => {
      // Cleanup streams and audio contexts
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Sync stream to video element when stream or videoRef changes
  useEffect(() => {
    if (videoRef.current && stream && hasCamera) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasCamera]);

  // Toggle Camera Track
  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraEnabled(videoTrack.enabled);
    }
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicEnabled(audioTrack.enabled);
    }
  };

  // Toggle Continuous Speech-to-Text
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-Text is not supported by your current browser. You can type directly into the answer box.');
      return;
    }

    if (isListeningSpeech) {
      recognitionRef.current.stop();
      setIsListeningSpeech(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningSpeech(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="card-saas p-4 relative overflow-hidden border-[#6366F1]/30">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Live Proctor Chamber
          </span>
        </div>

        {/* Live Status Chip */}
        {permissionState === 'granted' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[10px] text-[#10B981] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            Cam & Mic Online
          </span>
        )}
        {permissionState === 'audio-only' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Audio-Only Active
          </span>
        )}
        {permissionState === 'prompting' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[10px] text-[#818CF8] font-mono animate-pulse">
            Requesting Access...
          </span>
        )}
        {permissionState === 'denied' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-[10px] text-rose-300 font-mono">
            Hardware Blocked
          </span>
        )}
      </div>

      {/* Main Feed Box */}
      <div className="relative aspect-video rounded-xl bg-[#0F172A] border border-[#334155] overflow-hidden flex items-center justify-center mb-3 group">
        {hasCamera && cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {permissionState === 'denied' ? (
              <>
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-[#F8FAFC] font-semibold mb-1">
                  Hardware Access Disabled
                </p>
                <p className="text-[11px] text-[#94A3B8] max-w-xs leading-relaxed mb-3">
                  {errorMessage || 'Browser permissions denied. Click the button below to retry.'}
                </p>
                <button
                  type="button"
                  onClick={initHardware}
                  className="py-1 px-3 rounded-lg btn-primary-gradient text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Permissions
                </button>
              </>
            ) : hasMic ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center mb-2">
                  <Mic className="w-6 h-6 text-[#6366F1] animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-[#F8FAFC]">
                  Audio Proctoring Connected
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  Camera disabled or not detected; audio stream is monitored.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#6366F1]" />
                <span>Checking hardware permissions...</span>
              </div>
            )}
          </div>
        )}

        {/* AI Proctoring Watermark */}
        {permissionState === 'granted' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#090D16]/80 backdrop-blur-sm border border-[#334155] text-[9px] text-[#F8FAFC] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            AI Monitored
          </div>
        )}
      </div>

      {/* Audio Waveform Meter */}
      {hasMic && (
        <div className="mb-3 p-2 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center gap-3">
          <Volume2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <div className="flex-1 bg-[#1E293B] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel > 60
                  ? 'bg-[#10B981]'
                  : audioLevel > 25
                  ? 'bg-[#06B6D4]'
                  : 'bg-[#6366F1]'
              }`}
              style={{ width: `${Math.max(5, audioLevel)}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8] w-8 text-right">
            {audioLevel}%
          </span>
        </div>
      )}

      {/* Control Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Camera Toggle */}
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!hasCamera}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            cameraEnabled && hasCamera
              ? 'bg-[#0F172A] hover:bg-[#1E293B] border-[#334155] text-[#F8FAFC]'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          } disabled:opacity-40`}
          title={cameraEnabled ? 'Mute Camera' : 'Turn Camera On'}
        >
          {cameraEnabled && hasCamera ? (
            <>
              <Camera className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Cam On</span>
            </>
          ) : (
            <>
              <CameraOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Cam Off</span>
            </>
          )}
        </button>

        {/* Mic Toggle */}
        <button
          type="button"
          onClick={toggleMic}
          disabled={!hasMic}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            micEnabled && hasMic
              ? 'bg-[#0F172A] hover:bg-[#1E293B] border-[#334155] text-[#F8FAFC]'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          } disabled:opacity-40`}
          title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
        >
          {micEnabled && hasMic ? (
            <>
              <Mic className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Mic On</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Muted</span>
            </>
          )}
        </button>

        {/* Voice Dictation (Free Web Speech API) */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          disabled={!hasMic}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isListeningSpeech
              ? 'bg-gradient-to-r from-[#06B6D4] to-[#6366F1] text-white border-[#06B6D4] animate-pulse shadow-md shadow-cyan-500/30'
              : 'bg-[#0F172A] hover:bg-[#1E293B] border-[#334155] text-[#F8FAFC]'
          } disabled:opacity-40`}
          title="Dictate response via voice (Auto Speech-to-Text)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>{isListeningSpeech ? 'Dictating' : 'Voice-to-Text'}</span>
        </button>
      </div>

    </div>
  );
}
