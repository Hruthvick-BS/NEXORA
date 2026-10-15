
import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";


function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("");
  const [mcqs, setMcqs] = useState("");
  const [mcqStatus, setMcqStatus] = useState("");
  const [noticeResult, setNoticeResult] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("");

  const resources = [
    { icon: "📚", title: "Study Materials", detail: "Notes, PDFs and learning resources" },
    { icon: "📅", title: "Campus Notices", detail: "Updates, events and announcements" },
    { icon: "🎓", title: "Syllabus", detail: "Modules, subjects and curriculum" },
  ];

 
async function generateSummary() {
  try {
    setSummaryStatus("Generating your study summary...");
    setSummary("");

    const response = await fetch(
      `${API_URL}/api/summary`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Summary generation failed.");
    }

    setSummary(data.summary);
    setSummaryStatus("Study summary generated successfully!");
  } catch (error) {
    setSummaryStatus(error.message || "Could not generate summary.");
  }
}


async function askQuestion(e) {
  e.preventDefault();

  const userQuestion = question.trim();
  if (!userQuestion) return;

  setMessages((prev) => [
    ...prev,
    { question: userQuestion, answer: "Thinking..." }
  ]);
  setQuestion("");

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userQuestion })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        question: userQuestion,
        answer: data.reply
      };
      return updated;
    });
  } catch (error) {
    console.error("NEXORA chat error:", error);

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        question: userQuestion,
        answer: "Sorry bro, I couldn't connect to NEXORA AI. Please check that the backend is running."
      };
      return updated;
    });
  }
}


async function uploadPDF() {
  if (!selectedFile) {
    setUploadStatus("Please select a PDF first.");
    return;
  }

  const formData = new FormData();
  formData.append("pdf", selectedFile);

  try {
    setUploadStatus("Uploading PDF...");

    const response = await fetch(
      `${API_URL}/api/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    setUploadStatus("Uploaded successfully: " + data.fileName);
  } catch (error) {
    console.error("PDF upload error:", error);
    setUploadStatus(error.message || "PDF upload failed.");
  }
}


async function generateMCQs() {
  try {
    setMcqStatus("Generating 5 practice questions...");
    setMcqs("");

    const response = await fetch(
      `${API_URL}/api/mcq`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "MCQ generation failed.");
    }

    setMcqs(data.mcqs);
    setMcqStatus("Your practice questions are ready!");
  } catch (error) {
    setMcqStatus(
      error.message || "Could not generate MCQs. Please try again."
    );
  }
}

async function analyzeNotice() {
  try {
    setNoticeStatus("Analyzing your campus notice...");
    setNoticeResult("");

    const response = await fetch(
      `${API_URL}/api/notice`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Notice analysis failed."
      );
    }

    setNoticeResult(data.noticeAnalysis);
    setNoticeStatus("Notice analysis completed!");
  } catch (error) {
    setNoticeStatus(
      error.message || "Could not analyze the notice."
    );
  }
}

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">N</div>
          <div>
            <h2>NEXORA</h2>
            <span>Campus Intelligence</span>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>
        <a className="nav-item active" href="#home">⌂ <span>Dashboard</span></a>
        <a className="nav-item" href="#resources">▤ <span>Resources</span></a>
        <a className="nav-item" href="#assistant">✦ <span>AI Assistant</span></a>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>Prototype mode</span>
        </div>
      </aside>

      <main className="main" id="home">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR CAMPUS, CONNECTED</p>
            <h2>Good to see you! 👋</h2>
          </div>
          <div className="profile">S</div>
        </header>

        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">✦ SMARTER CAMPUS EXPERIENCE</span>
            <h1>One Campus.<br /><span>One Intelligence.</span></h1>
            <p>
              Your academic world, all in one place. Discover resources,
              explore campus updates and get help with NEXORA.
            </p>
            <a className="primary-btn" href="#assistant">Ask NEXORA <span>↗</span></a>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="core">N<span>✦</span></div>
            <div className="float-card card-top">📚 <span>Learning resources</span></div>
            <div className="float-card card-bottom">✦ <span>Campus intelligence</span></div>
          </div>
        </section>

        <section className="section" id="resources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR ACADEMIC HUB</p>
              <h2>Explore your campus</h2>
            </div>
            <span className="section-note">Everything in one place</span>
          </div>

          
          <div className="resource-grid">
            {resources.map((item) => (
            <article className="resource-card" key={item.title}>
            <div className="resource-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>

              <a
              href={item.title === "Campus Notices" ? "#notice-analyzer" : "#assistant"}
              >
              Explore resources <span>→</span>
             </a>
             </article>
             ))}
          </div>
          
<section id="notice-analyzer" className="notice-analyzer">
  <h2>📅 AI Campus Notice Analyzer</h2>
  <p>
    Upload a college notice using the PDF uploader above,
    then analyze it to identify important information.
  </p>

  <button type="button" onClick={analyzeNotice}>
    Analyze Campus Notice
  </button>

  {noticeStatus && <p>{noticeStatus}</p>}

  {noticeResult && (
    <div className="notice-result">
      <h3>Notice Summary</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {noticeResult}
      </p>
    </div>
  )}
</section>

        </section>

        <section className="assistant-section" id="assistant">
          <div className="assistant-info">
            <div className="assistant-symbol">✦</div>
            <p className="eyebrow">YOUR AI COMPANION</p>
            <h2>Meet NEXORA AI</h2>
            <p>Ask a question about your subjects, syllabus or campus resources.</p>
            <div className="demo-note">● Demo assistant · Answers are illustrative</div>
          </div>

          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-avatar">N</div>
              <div><strong>NEXORA Assistant</strong><p>Campus knowledge companion</p></div>
              <span className="online-dot" />
            </div>

            <div className="chat-body">
              <div className="bot-message">
                Hey there! 👋 I'm NEXORA. What would you like to know about your campus?
              </div>

              {messages.map((item, index) => (
                <div key={index}>
                  <div className="user-message">{item.question}</div>
                  <div className="bot-message">{item.answer}</div>
                </div>
              ))}

              <div className="suggestions">
                {["Explain my syllabus", "Find study materials", "Campus announcements"].map((text) => (
                  <button key={text} onClick={() => setQuestion(text)}>{text}</button>
                ))}
              </div>
            </div>
            
            <div className="pdf-upload">
                <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />

               <button type="button" onClick={uploadPDF}>
                Upload PDF
               </button>

               {uploadStatus && (
               <p>{uploadStatus}</p>
               )}
            </div>
            
            <div className="study-summary">
              <button type="button" onClick={generateSummary}>
              Generate Study Summary
               </button>

               {summaryStatus && <p>{summaryStatus}</p>}

               {summary && (
               <div className="summary-result">
                 <h3>Your Study Summary</h3>
                 <p style={{ whiteSpace: "pre-wrap" }}>{summary}</p>
               </div>
               )}
            </div>

            
             <div className="mcq-generator">
                <button type="button" onClick={generateMCQs}>
                Generate Practice MCQs
                </button>

                {mcqStatus && <p>{mcqStatus}</p>}

                {mcqs && (
                <div className="mcq-result">
                <h3>Your Practice Questions</h3>
                 <p style={{ whiteSpace: "pre-wrap" }}>{mcqs}</p>
                </div>
                )}
            </div>

            <form className="chat-input" onSubmit={askQuestion}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your campus..."
                aria-label="Ask NEXORA a question"
              />
              <button type="submit" aria-label="Send question">↑</button>
            </form>
          </div>
        </section>

        <footer>© 2026 NEXORA · One Campus, One Intelligence.</footer>
      </main>
    </div>
  );
}

export default App;
