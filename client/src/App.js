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

  // Initialize speech recognition
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
      const response = await fetch("http://localhost:3001/predict", {
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
      // Round the prediction to 1 decimal place
      setPrediction(Math.round(data.prediction * 10) / 10);
    } catch (error) {
      console.error("❌ Error while calling /predict:", error);
      setError(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  const testConnection = async () => {
    try {
      const response = await fetch("http://localhost:3001/test");
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
          <circle
            className="progress-ring-background"
            cx="90"
            cy="90"
            r={radius}
          />
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
      <header className="header">
        <h1>🎤 Speech Completion Predictor</h1>
        <p>Advanced AI-powered speech analysis and completion prediction</p>
      </header>

      <div className="main-content">
        <div className="input-section">
          <h2 className="section-title">
            📝 Input Speech
          </h2>
          
          <div className="input-controls">
            <div className="input-type-toggle">
              <button
                className={`toggle-btn ${inputType === 'text' ? 'active' : ''}`}
                onClick={() => setInputType('text')}
              >
                ✍️ Text
              </button>
              <button
                className={`toggle-btn ${inputType === 'voice' ? 'active' : ''}`}
                onClick={() => setInputType('voice')}
              >
                🎤 Voice
              </button>
            </div>
            
            <button className="connection-test" onClick={testConnection}>
              🔗 Test Connection
            </button>
          </div>

          {inputType === 'text' ? (
            <div className="text-input-area">
              <textarea
                className="text-input"
                placeholder="Paste your speech transcript here... Start typing or speaking your speech content."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          ) : (
            <div className={`voice-input-area ${isRecording ? 'recording' : ''}`}>
              <button
                className={`voice-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? '🛑' : '🎤'}
              </button>
              <div className={`voice-status ${isRecording ? 'recording' : ''}`}>
                {isRecording ? 'Recording... Speak now!' : 'Click to start recording'}
              </div>
              {!recognition && (
                <p className="voice-error">
                  Speech recognition not supported in this browser
                </p>
              )}
            </div>
          )}

          {inputText && (
            <div className="text-preview">
              <h4>📄 Current Input ({inputText.trim().split(/\s+/).length} words)</h4>
              <p>{inputText.length > 200 ? inputText.substring(0, 200) + '...' : inputText}</p>
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="predict-btn" 
              onClick={handlePredict} 
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Analyzing...
                </>
              ) : (
                '🔮 Predict Completion'
              )}
            </button>
            
            {inputText && (
              <button className="clear-btn" onClick={clearInput}>
                🗑️ Clear
              </button>
            )}
          </div>
        </div>

        <div className="results-section">
          <h2 className="section-title">
            📊 Analysis Results
          </h2>

          {error && (
            <div className="error">
              <div className="error-icon">❌</div>
              <div className="error-content">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {prediction !== null && (
            <div className="prediction-results">
              <div className="prediction-header">
                <h3>🎯 Speech Completion Prediction</h3>
                <p>AI-powered analysis of your speech progress</p>
              </div>

              <CircularProgress percentage={prediction} />

              <div className="completion-stats">
                <div className="stat-item completed">
                  <div className="stat-value">{prediction}%</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item remaining">
                  <div className="stat-value">{Math.round((100 - prediction) * 10) / 10}%</div>
                  <div className="stat-label">Remaining</div>
                </div>
              </div>
            </div>
          )}

          {textAnalysis && (
            <div className="analysis-section">
              <h3>📈 Text Analysis</h3>
              
              <div className="analysis-grid">
                <div className="analysis-card">
                  <div className="card-value">{textAnalysis.wordCount}</div>
                  <div className="card-label">Words</div>
                </div>
                <div className="analysis-card">
                  <div className="card-value">{textAnalysis.sentenceCount}</div>
                  <div className="card-label">Sentences</div>
                </div>
                <div className="analysis-card">
                  <div className="card-value">{textAnalysis.paragraphCount}</div>
                  <div className="card-label">Paragraphs</div>
                </div>
                <div className="analysis-card">
                  <div className="card-value">{textAnalysis.avgWordsPerSentence}</div>
                  <div className="card-label">Avg Words/Sentence</div>
                </div>
              </div>

              <div className="structure-analysis">
                <h4>🏗️ Speech Structure Analysis</h4>
                <div className="structure-grid">
                  <div className="structure-item intro">
                    <div className="structure-icon">🚀</div>
                    <div className="structure-content">
                      <h5>Introduction</h5>
                      <p>{textAnalysis.structure.introduction}% of content</p>
                    </div>
                  </div>
                  <div className="structure-item body">
                    <div className="structure-icon">📖</div>
                    <div className="structure-content">
                      <h5>Body</h5>
                      <p>{textAnalysis.structure.body}% of content</p>
                    </div>
                  </div>
                  <div className="structure-item conclusion">
                    <div className="structure-icon">🎯</div>
                    <div className="structure-content">
                      <h5>Conclusion</h5>
                      <p>{textAnalysis.structure.conclusion}% of content</p>
                    </div>
                  </div>
                  <div className="structure-item other">
                    <div className="structure-icon">🔄</div>
                    <div className="structure-content">
                      <h5>Other</h5>
                      <p>{textAnalysis.structure.other}% of content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!prediction && !textAnalysis && !error && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>Ready for Analysis</h3>
              <p>Input your speech text or use voice recording to get started with AI-powered completion prediction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;