import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { interviewApi } from "../api/interview";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Volume2, Mic, Maximize2 } from "lucide-react";

export default function Interview() {
  const [interviewState, setInterviewState] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [allFeedback, setAllFeedback] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

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
      requestFullscreen();
      if (data.question?.text) speakText(data.question.text);
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to start interview")
  });

  const submitMutation = useMutation({
    mutationFn: () => interviewApi.submitAnswer(interviewState.interview_id, interviewState.question.id, answerText),
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
        if (data.next_question?.text) speakText(data.next_question.text);
      }
    },
    onError: (err: any) => alert(err.response?.data?.detail || "Failed to submit answer")
  });

  const [isListening, setIsListening] = useState(false);
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
      window.speechSynthesis?.cancel();
    };
  }, [interviewState]);

  const [timeLeft, setTimeLeft] = useState(60);
  const answerTextRef = useRef(answerText);
  
  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);

  useEffect(() => {
    let interval: any;
    if (isListening && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isListening && timeLeft === 0) {
      // Time's up! Auto stop and submit.
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (answerTextRef.current.length > 5) {
        submitMutation.mutate();
      }
    }
    return () => clearInterval(interval);
  }, [isListening, timeLeft, submitMutation]);

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (answerTextRef.current.length > 5) {
        submitMutation.mutate();
      }
      return;
    }
    
    // Stop speaking if they interrupt
    window.speechSynthesis?.cancel();
    setIsAiSpeaking(false);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    
    setTimeLeft(60); // Reset timer to 60s for each answer
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript) {
        setAnswerText((prev) => prev + finalTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  if (!interviewState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 p-4">
        <h1 className="text-3xl font-bold mb-4">Adaptive Interview Simulator</h1>
        <p className="mb-8 text-muted-foreground text-center max-w-md">
          SkillTwin will dynamically adjust question difficulty and topic based on your actual experience and ongoing performance.
          This experience is best taken in full-screen mode.
        </p>
        <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending} size="lg" className="h-14 px-8 text-lg rounded-full">
          {startMutation.isPending ? "Setting up..." : <><Maximize2 className="w-5 h-5 mr-2" /> Start Full-Screen Interview</>}
        </Button>
      </div>
    );
  }

  return (
    <div className={`container max-w-5xl mx-auto py-8 transition-all ${interviewState.completed ? '' : 'min-h-screen flex items-center'}`}>
      <Card className={`shadow-2xl border-slate-200 w-full ${!interviewState.completed ? 'scale-[1.02] bg-white/95 backdrop-blur' : ''}`}>
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle>SkillTwin Live Interview</CardTitle>
          <div className="flex items-center gap-4">
            {isListening && (
              <div className={`flex items-center font-bold px-3 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
                ⏱ {timeLeft}s remaining
              </div>
            )}
            {isAiSpeaking && (
              <div className="flex items-center text-primary font-medium">
                <Volume2 className="w-5 h-5 mr-2 animate-pulse" /> AI is speaking...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {interviewState.completed ? (
            <div className="py-4">
              <h2 className="text-3xl font-bold mb-6 text-center text-slate-900">Interview Summary Report</h2>
              <p className="text-center text-slate-600 mb-8">Here is the detailed feedback on each of your answers and what you can improve.</p>
              <div className="space-y-6">
                {allFeedback.map((fb, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-lg text-primary mb-3">Question {idx + 1} Feedback</h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{fb}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button size="lg" onClick={() => window.location.href='/profile'}>Go to My Profile</Button>
              </div>
            </div>
          ) : (
            <>
              <div className={`p-8 rounded-2xl text-2xl font-medium text-slate-900 border transition-all duration-300 ${isAiSpeaking ? 'bg-primary/10 border-primary/30 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                {isAiSpeaking && (
                  <div className="flex space-x-1 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {interviewState.question?.text}
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 mt-8">
                <div className="w-full md:w-1/2 flex flex-col space-y-4">
                  <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner relative ring-4 ring-slate-100">
                    <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                    {isListening && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full animate-pulse flex items-center shadow-lg font-bold">
                        <span className="w-2 h-2 bg-white rounded-full mr-2" /> RECORDING
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant={isListening ? "destructive" : "default"} 
                    className="w-full py-8 text-xl font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
                    onClick={toggleListen}
                  >
                    {isListening ? "⏹ Stop Speaking & Auto-Submit" : <><Mic className="w-6 h-6 mr-2" /> Tap to Speak Answer</>}
                  </Button>
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col">
                  <label className="font-semibold text-sm text-slate-700 mb-2 uppercase tracking-wider">Live Transcription</label>
                  <div className={`w-full flex-1 min-h-[200px] p-6 bg-white border-2 rounded-2xl shadow-sm whitespace-pre-wrap text-slate-700 text-xl transition-all ${isListening ? 'border-primary/50 ring-4 ring-primary/10' : 'border-slate-200'}`}>
                    {answerText || <span className="text-slate-400 italic font-light">Your spoken answer will appear here...</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        {!interviewState.completed && (
          <CardFooter className="flex justify-end border-t bg-slate-50/50 p-6 rounded-b-xl">
            <Button 
              size="lg"
              className="px-10 py-6 text-lg rounded-xl shadow-md font-bold"
              onClick={() => submitMutation.mutate()} 
              disabled={!answerText || submitMutation.isPending || isListening}
            >
              {submitMutation.isPending ? "Evaluating Response..." : "Submit Answer"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
