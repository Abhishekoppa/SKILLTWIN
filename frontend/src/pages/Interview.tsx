import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { interviewApi } from "../api/interview";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Volume2, Mic, Maximize2, Code, Terminal, Clock, CheckCircle } from "lucide-react";

export default function Interview() {
  const [interviewState, setInterviewState] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [allFeedback, setAllFeedback] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sarvamKey = "sk_uw24k648_p61nQvvOsULVUDwHFul7fZuZ";

  const speakText = async (text: string) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsAiSpeaking(true);
    
    try {
      const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: "hi-IN",
          speaker: "meera",
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: "bulbul:v1"
        })
      });
      if (response.ok) {
        const data = await response.json();
        const base64Audio = data.audios[0];
        const audio = new Audio("data:audio/wav;base64," + base64Audio);
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = audio;
        audio.onended = () => setIsAiSpeaking(false);
        audio.onerror = () => setIsAiSpeaking(false);
        await audio.play();
        return;
      }
    } catch (err) {
      console.error("Sarvam TTS failed, falling back to native", err);
    }
    
    // Fallback to Native SpeechSynthesis
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log(`Error attempting to enable fullscreen: ${err.message}`));
    }
  };

  const startMutation = useMutation({
    mutationFn: interviewApi.startInterview,
    onSuccess: (data) => {
      setInterviewState(data);
      setTimeLeft(data.question.time_limit_seconds || 90);
      requestFullscreen();
      if (data.question?.text) {
        speakText("Welcome to the SkillTwin live interview. " + data.question.text);
      }
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to start interview")
  });

  const submitMutation = useMutation({
    mutationFn: () => interviewApi.submitAnswer(interviewState.interview_id, interviewState.question.id, answerTextRef.current),
    onSuccess: (data) => {
      setAllFeedback(prev => [...prev, data.feedback]);
      if (data.status === "completed") {
        setInterviewState({ ...interviewState, completed: true });
        speakText("Interview complete. Generating your summary report.");
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => console.log(err));
        }
      } else {
        setInterviewState({ ...interviewState, question: data.next_question });
        setAnswerText(""); // reset
        setTimeLeft(data.next_question.time_limit_seconds || 90);
        setIsListening(false);
        if (recognitionRef.current) recognitionRef.current.stop();
        if (data.next_question?.text) {
          speakText(data.next_question.text);
        }
      }
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to submit answer")
  });

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (interviewState && !interviewState.completed) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Webcam error:", err));
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [interviewState]);

  const [timeLeft, setTimeLeft] = useState(90);
  const answerTextRef = useRef(answerText);
  
  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);

  useEffect(() => {
    let interval: any;
    if (interviewState && !interviewState.completed && timeLeft > 0 && !isAiSpeaking) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (interviewState && !interviewState.completed && timeLeft === 0 && !submitMutation.isPending) {
      // Time's up! Auto submit.
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      submitMutation.mutate();
    }
    return () => clearInterval(interval);
  }, [interviewState, isAiSpeaking, timeLeft, submitMutation]);

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }
    
    // Stop speaking if they interrupt
    if (audioRef.current) audioRef.current.pause();
    setIsAiSpeaking(false);
    
    // Start MediaRecorder for Sarvam STT
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsTranscribing(true);
        const mimeType = mediaRecorder.mimeType;
        // Whisper natively supports webm and mp4, we can safely pass it
        const cleanMimeType = mimeType.includes('mp4') ? 'audio/mp4' : 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: cleanMimeType });
        const filename = mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm';
        
        try {
          const data = await interviewApi.transcribeAudio(audioBlob, filename);
          if (data.transcript) {
            setAnswerText(prev => prev + " " + data.transcript);
          } else {
            console.error("Transcription Failed", data);
            alert("Failed to transcribe audio.");
          }
        } catch (e) {
          console.error("STT Request Error", e);
          alert("Failed to reach transcription server.");
        }
        setIsTranscribing(false);
      };
      
      mediaRecorder.start();
      setIsListening(true);
      
      recognitionRef.current = {
        stop: () => {
          if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
        }
      };
    }).catch(err => {
      alert("Microphone access denied or unavailable: " + err.message);
      setIsListening(false);
    });
  };

  const handleManualCodeSubmit = () => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    submitMutation.mutate();
  };

  if (!interviewState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4">
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">Adaptive Interview Simulator</h1>
        <p className="mb-10 text-slate-600 text-center max-w-lg text-lg leading-relaxed">
          SkillTwin dynamically adjusts question difficulty and topic based on your actual experience and ongoing performance. 
          Get ready for a live, adaptive challenge.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending} size="lg" className="h-16 px-10 text-xl rounded-full shadow-xl hover:shadow-indigo-500/20 transition-all bg-indigo-600 hover:bg-indigo-700">
            {startMutation.isPending ? "Setting up..." : <><Maximize2 className="w-6 h-6 mr-3" /> Start Full-Screen Interview</>}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-16 px-10 text-xl rounded-full bg-white text-slate-700 border-slate-300"
            onClick={() => {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                  alert("Microphone successfully connected!");
                  stream.getTracks().forEach(track => track.stop());
                })
                .catch(err => alert(`Microphone test failed: ${err.message}`));
            }}
          >
            <Mic className="w-6 h-6 mr-3" /> Test Microphone
          </Button>
        </div>
      </div>
    );
  }

  const isCoding = interviewState.question?.is_coding_question;
  const timeLimit = interviewState.question?.time_limit_seconds || 90;
  const progressPercent = Math.max(0, (timeLeft / timeLimit) * 100);

  return (
    <div className={`min-h-screen bg-slate-900 p-4 md:p-8 flex flex-col transition-all ${interviewState.completed ? 'bg-slate-50' : ''}`}>
      <div className={`max-w-7xl mx-auto w-full flex-1 flex flex-col ${!interviewState.completed ? 'animate-in fade-in duration-500' : ''}`}>
        <Card className={`flex-1 flex flex-col shadow-2xl border-0 overflow-hidden ${interviewState.completed ? 'bg-white' : 'bg-slate-800 text-white'}`}>
          <CardHeader className={`border-b ${interviewState.completed ? 'bg-slate-50' : 'bg-slate-900'} flex flex-row items-center justify-between p-6`}>
            <CardTitle className="flex items-center text-2xl font-bold tracking-tight">
              {interviewState.completed ? 'Interview Complete' : <><Terminal className="w-6 h-6 mr-3 text-indigo-400" /> SkillTwin Live Challenge</>}
            </CardTitle>
            {!interviewState.completed && (
              <div className="flex items-center gap-6">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setInterviewState({ ...interviewState, completed: true })}
                  className="font-bold tracking-wider"
                >
                  End Early
                </Button>
                {isAiSpeaking && (
                  <div className="flex items-center text-indigo-400 font-medium bg-indigo-500/10 px-4 py-2 rounded-full ring-1 ring-indigo-500/30">
                    <Volume2 className="w-5 h-5 mr-2 animate-pulse" /> AI is speaking...
                  </div>
                )}
                <div className={`flex items-center font-bold px-4 py-2 rounded-full tracking-wider transition-colors ${timeLeft <= 30 ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                  <Clock className="w-5 h-5 mr-2" />
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}
          </CardHeader>
          
          {!interviewState.completed && (
            <div className="h-1.5 w-full bg-slate-700">
              <div 
                className={`h-full transition-all duration-1000 ${timeLeft <= 30 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          )}

          <CardContent className="flex-1 flex flex-col p-0">
            {interviewState.completed ? (
              <div className="py-12 px-6 max-w-4xl mx-auto w-full">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900">Summary Report</h2>
                  <p className="text-slate-500 mt-3 text-lg">Detailed feedback and analytics for your performance.</p>
                </div>
                <div className="space-y-6">
                  {allFeedback.map((fb, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-xl text-indigo-600 mb-4 flex items-center">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md mr-3 text-sm">Q{idx + 1}</span>
                        Feedback
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{fb}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-12 text-center flex flex-col sm:flex-row justify-center gap-4">
                  <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg" onClick={() => window.location.href='/profile'}>
                    View My Full Profile
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full shadow-sm" onClick={() => window.location.reload()}>
                    Start New Interview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 gap-6">
                <div className="bg-slate-700/30 border border-slate-700 p-8 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-indigo-300 font-semibold tracking-wider text-sm uppercase">Question</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => speakText(interviewState.question?.text)}
                      className="text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      Listen Again
                    </Button>
                  </div>
                  <p className="text-2xl font-medium leading-relaxed text-slate-100">
                    {interviewState.question?.text}
                  </p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-6 flex-1">
                  <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative ring-1 ring-slate-700 shadow-xl">
                      <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1] opacity-90" />
                      {isListening && (
                        <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full animate-pulse flex items-center shadow-lg font-bold">
                          <span className="w-2 h-2 bg-white rounded-full mr-2" /> RECORDING
                        </div>
                      )}
                    </div>
                    {!isCoding && (
                      <Button 
                        type="button" 
                        variant={isListening ? "destructive" : "default"} 
                        className={`w-full py-8 text-xl font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] ${!isListening && 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                        onClick={toggleListen}
                        disabled={isTranscribing}
                      >
                        {isTranscribing ? "Transcribing..." : isListening ? "⏹ Stop Speaking" : <><Mic className="w-6 h-6 mr-3" /> Tap to Speak</>}
                      </Button>
                    )}
                  </div>
                  
                  <div className="w-full lg:w-2/3 flex flex-col h-full min-h-[300px]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-semibold text-sm text-slate-400 uppercase tracking-wider flex items-center">
                        {isCoding ? <><Code className="w-4 h-4 mr-2" /> Code Editor</> : 'Live Transcription'}
                      </label>
                      {isCoding && <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">Python / TS</span>}
                    </div>
                    {isCoding ? (
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="# Write your code here..."
                        className="w-full flex-1 p-6 bg-[#0d1117] text-[#c9d1d9] font-mono text-base lg:text-lg border border-slate-700 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        spellCheck={false}
                      />
                    ) : (
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder={isTranscribing ? "Transcribing your audio with Sarvam AI..." : "Your spoken answer will appear here... (You can also type manually if your microphone fails)"}
                        className={`w-full flex-1 p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-inner text-slate-300 text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${isListening ? 'ring-2 ring-indigo-500/50 bg-slate-800/80' : ''}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {!interviewState.completed && (
            <CardFooter className="flex justify-between items-center border-t border-slate-800 bg-slate-900 p-6">
              <div className="text-slate-500 text-sm font-medium">
                {isCoding ? "Coding Challenge Mode" : "Conceptual Interview Mode"}
              </div>
              <Button 
                size="lg"
                className="px-10 py-6 text-lg rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-200 transition-colors"
                onClick={handleManualCodeSubmit} 
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Evaluating..." : (!answerText ? "Skip Question" : "Submit Answer")}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
