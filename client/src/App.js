import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputType, setInputType] = useState("text");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [textAnalysis, setTextAnalysis] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      setError(null);
    }
  };

  const analyzeText = (text) => {
    if (!text.trim()) return null;

    const words = text.trim().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

    const introKeywords = ['hello', 'welcome', 'today', 'introduce', 'begin', 'start'];
    const bodyKeywords = ['first', 'second', 'next', 'furthermore', 'however', 'therefore', 'because'];
    const conclusionKeywords = ['conclusion', 'finally', 'summary', 'thank', 'end', 'questions'];

    const textLower = text.toLowerCase();
    const introScore = introKeywords.reduce((acc, word) => acc + (textLower.includes(word) ? 1 : 0), 0);
    const bodyScore = bodyKeywords.reduce((acc, word) => acc + (textLower.includes(word) ? 1 : 0), 0);
    const conclusionScore = conclusionKeywords.reduce((acc, word) => acc + (textLower.includes(word) ? 1 : 0), 0);

    const totalScore = introScore + bodyScore + conclusionScore + 1;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: Math.round(words.length / sentences.length),
      structure: {
        introduction: Math.round((introScore / totalScore) * 100),
        body: Math.round((bodyScore / totalScore) * 100),
        conclusion: Math.round((conclusionScore / totalScore) * 100),
        other: Math.round(((1) / totalScore) * 100)
      }
    };
  };

  const handlePredict = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text first");
      return;
    }

    setLoading(true);
    setPrediction(null);
    setError(null);

    const analysis = analyzeText(inputText);
    setTextAnalysis(analysis);

    console.log("Sending request with transcript:", inputText);

    try {
      const response = await fetch("https://speech-backend-wvx5.onrender.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("✅ Received response:", data);
      setPrediction(Math.round(data.prediction * 10) / 10);
    } catch (error) {
      console.error("❌ Error while calling /predict:", error);
      setError(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  const testConnection = async () => {
    try {
      const response = await fetch("https://speech-backend-wvx5.onrender.com/test");
      const data = await response.json();
      console.log("✅ Backend connection test:", data);
      setError(null);
      alert("Backend connection successful!");
    } catch (error) {
      console.error("❌ Backend connection failed:", error);
      setError("Backend connection failed");
    }
  };

  const clearInput = () => {
    setInputText("");
    setPrediction(null);
    setTextAnalysis(null);
    setError(null);
  };

  const CircularProgress = ({ percentage }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-circle">
        <svg width="180" height="180" className="progress-ring">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4299e1" />
              <stop offset="100%" stopColor="#667eea" />
            </linearGradient>
          </defs>
          <circle className="progress-ring-background" cx="90" cy="90" r={radius} />
          <circle
            className="progress-ring-progress"
            cx="90"
            cy="90"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="progress-text">
          <div className="progress-percentage">{percentage}%</div>
          <div className="progress-label">Complete</div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {/* ... UI code remains unchanged ... */}
    </div>
  );
}

export default App;
