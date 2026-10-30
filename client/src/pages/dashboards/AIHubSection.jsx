import { useState, useEffect } from "react";
import { aiAnalyzeResume, aiGenerateInterview, aiEvaluateInterview, aiJobMatch, aiChat } from "../../services/api";

function AIHubSection({ profile, jobs = [] }) {
  const [activeTab, setActiveTab] = useState("resume");

  // --- Tab 1: Resume State ---
  const [targetRole, setTargetRole] = useState("fullstack");
  const [resumeText, setResumeText] = useState("");
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);

  // --- Tab 2: Interview Prep State ---
  const [interviewCompany, setInterviewCompany] = useState("Google");
  const [interviewRole, setInterviewRole] = useState("Full Stack Developer");
  const [interviewDifficulty, setInterviewDifficulty] = useState("medium");
  const [generatingInterview, setGeneratingInterview] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [answerEvaluation, setAnswerEvaluation] = useState(null);

  // --- Tab 3: Job Matcher State ---
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidateSkillsInput, setCandidateSkillsInput] = useState("");
  const [matchingJob, setMatchingJob] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState(null);

  // Prefill default skills & resume text from profile if available
  useEffect(() => {
    if (profile) {
      const skills = profile.profile?.academic?.skills?.technical || profile.profile?.skills?.technical || [];
      const skillsStr = skills.join(", ");
      if (skillsStr && !candidateSkillsInput) {
        setCandidateSkillsInput(skillsStr);
      }
      if (!resumeText) {
        const name = profile.name || "Student Candidate";
        const deg = profile.profile?.basicInfo?.degree || "B.Tech Computer Science";
        const cgpa = profile.profile?.basicInfo?.cgpa || "8.5";
        setResumeText(
          `${name}\n${deg} | CGPA: ${cgpa}\nTechnical Skills: ${skillsStr || "JavaScript, React, Node.js, Python, MongoDB"}\nProjects:\n- Developed Campus Placement Portal with React and Node.js.\n- Built real-time analytics dashboard with MongoDB database.`
        );
      }
    }
  }, [profile]);

  // Handler: Analyze Resume
  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) return;
    setAnalyzingResume(true);
    try {
      const res = await aiAnalyzeResume({
        resumeText: resumeText.trim(),
        targetRole
      });
      setResumeResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingResume(false);
    }
  };

  // Handler: Generate Interview
  const handleGenerateInterview = async () => {
    setGeneratingInterview(true);
    setAnswerEvaluation(null);
    setUserAnswer("");
    try {
      const res = await aiGenerateInterview({
        company: interviewCompany,
        role: interviewRole,
        difficulty: interviewDifficulty
      });
      if (res.questions && res.questions.length > 0) {
        setInterviewQuestions(res.questions);
        setActiveQuestionIdx(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInterview(false);
    }
  };

  // Handler: Evaluate Interview Answer
  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim() || !interviewQuestions[activeQuestionIdx]) return;
    setEvaluatingAnswer(true);
    try {
      const curQ = interviewQuestions[activeQuestionIdx];
      const res = await aiEvaluateInterview({
        question: curQ.question,
        answer: userAnswer.trim(),
        category: curQ.category
      });
      setAnswerEvaluation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  // Handler: Job Match
  const handleJobMatch = async () => {
    setMatchingJob(true);
    try {
      let targetJob = jobs.find((j) => (j._id || j.id) === selectedJobId);
      if (!targetJob && jobs.length > 0) targetJob = jobs[0];

      const jobSkills = targetJob?.skills || ["React", "Node.js", "MongoDB", "Data Structures", "Docker"];
      const candSkills = candidateSkillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await aiJobMatch({
        candidateSkills: candSkills,
        jobSkills,
        jobTitle: targetJob?.title || "Full Stack Software Engineer"
      });
      setJobMatchResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingJob(false);
    }
  };

  return (
    <div className="dashboard-section ai-hub-container" style={{ padding: "10px 0" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.22) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.35)",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>✨</span>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>AI Career Intelligence Suite</h2>
            <span
              style={{
                background: "#10b981",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "12px"
              }}
            >
              ACTIVE
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--text-muted, #94a3b8)", fontSize: "14px" }}>
            AI-powered ATS Resume Scanner, Interactive Mock Interview Simulator & Smart Placement Matcher.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`menu-btn ${activeTab === "resume" ? "active" : ""}`}
            onClick={() => setActiveTab("resume")}
            style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "10px" }}
          >
            📄 Resume ATS Optimizer
          </button>
          <button
            type="button"
            className={`menu-btn ${activeTab === "interview" ? "active" : ""}`}
            onClick={() => setActiveTab("interview")}
            style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "10px" }}
          >
            🎙️ AI Mock Interviewer
          </button>
          <button
            type="button"
            className={`menu-btn ${activeTab === "matcher" ? "active" : ""}`}
            onClick={() => setActiveTab("matcher")}
            style={{ padding: "8px 16px", fontSize: "13px", borderRadius: "10px" }}
          >
            🎯 Job Compatibility Matcher
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RESUME ATS SCANNER & OPTIMIZER */}
      {/* ======================================================== */}
      {activeTab === "resume" && (
        <div className="section-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>📄 AI Resume & ATS Keyword Analyzer</h3>
              <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
                Scan your resume against real recruiter screening algorithms to boost interview callbacks.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600" }}>Target Role:</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--input-bg, #1e293b)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px"
                }}
              >
                <option value="fullstack">Full Stack Developer</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Developer</option>
                <option value="data_analyst">Data Analyst / Scientist</option>
                <option value="cloud_devops">Cloud & DevOps Engineer</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: resumeResult ? "1.1fr 0.9fr" : "1fr", gap: "20px" }}>
            {/* Input Side */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Paste Resume Text, Summary & Project Highlights:
              </label>
              <textarea
                rows={11}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your education, skills, project descriptions, and experience here..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "var(--input-bg, #0f172a)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleAnalyzeResume}
                disabled={analyzingResume || !resumeText.trim()}
                style={{ marginTop: "12px", width: "100%", padding: "12px", fontSize: "14px", fontWeight: "700" }}
              >
                {analyzingResume ? "⏳ Scanning with AI Engine..." : "🚀 Run AI ATS Audit"}
              </button>
            </div>

            {/* Results Side */}
            {resumeResult && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "20px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Estimated Score</span>
                    <h2
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "36px",
                        color: resumeResult.atsScore >= 75 ? "#10b981" : resumeResult.atsScore >= 60 ? "#f59e0b" : "#ef4444"
                      }}
                    >
                      {resumeResult.atsScore}%
                    </h2>
                  </div>
                  <div
                    style={{
                      background: resumeResult.atsScore >= 75 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                      color: resumeResult.atsScore >= 75 ? "#10b981" : "#f59e0b",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    {resumeResult.atsScore >= 75 ? "✅ Strong ATS Match" : "⚠️ Needs Optimization"}
                  </div>
                </div>

                {/* Keyword Match Tags */}
                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981", display: "block", marginBottom: "6px" }}>
                    ✓ Matched Industry Keywords ({resumeResult.matchedKeywords.length}):
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {resumeResult.matchedKeywords.map((k) => (
                      <span
                        key={k}
                        style={{
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#34d399",
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                {resumeResult.missingKeywords.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#f87171", display: "block", marginBottom: "6px" }}>
                      + Recommended Keywords to Add ({resumeResult.missingKeywords.length}):
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {resumeResult.missingKeywords.map((k) => (
                        <span
                          key={k}
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#fca5a5",
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          +{k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    💡 AI Impact Rewrite Example:
                  </span>
                  <div style={{ background: "rgba(30, 41, 59, 0.6)", borderRadius: "8px", padding: "10px", fontSize: "12px" }}>
                    <p style={{ margin: "0 0 6px 0", color: "#ef4444" }}>
                      <strong>Before:</strong> Worked on authentication and built login for users.
                    </p>
                    <p style={{ margin: 0, color: "#10b981" }}>
                      <strong>After (XYZ Formula):</strong> Engineered secure JWT-based multi-role authentication system, reducing session drops by 40%.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AI MOCK INTERVIEW SIMULATOR */}
      {/* ======================================================== */}
      {activeTab === "interview" && (
        <div className="section-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>🎙️ AI Mock Interviewer & Evaluator</h3>
              <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
                Generate company-specific technical and behavioral questions, submit your answer, and receive AI score feedback.
              </p>
            </div>

            {/* Selectors */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={interviewCompany}
                onChange={(e) => setInterviewCompany(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--input-bg, #1e293b)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px"
                }}
              >
                <option value="Google">Google</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
                <option value="TCS">TCS / Infosys</option>
                <option value="FinTech Startup">FinTech Startup</option>
              </select>

              <select
                value={interviewRole}
                onChange={(e) => setInterviewRole(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--input-bg, #1e293b)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px"
                }}
              >
                <option value="Full Stack Developer">Full Stack SDE</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Data Analyst">Data Analyst</option>
              </select>

              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateInterview}
                disabled={generatingInterview}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                {generatingInterview ? "⏳ Generating..." : "⚡ Generate Questions"}
              </button>
            </div>
          </div>

          {/* Question & Answer Box */}
          {interviewQuestions.length > 0 ? (
            <div style={{ marginTop: "16px" }}>
              {/* Question Navigation */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
                {interviewQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setActiveQuestionIdx(idx);
                      setAnswerEvaluation(null);
                      setUserAnswer("");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: activeQuestionIdx === idx ? "#6366f1" : "rgba(255,255,255,0.06)",
                      color: activeQuestionIdx === idx ? "#fff" : "#94a3b8",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Q{idx + 1}: {q.category.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Question Card */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#818cf8", fontWeight: "700", textTransform: "uppercase" }}>
                    {interviewQuestions[activeQuestionIdx].category}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Target: {interviewCompany}</span>
                </div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", lineHeight: "1.5" }}>
                  {interviewQuestions[activeQuestionIdx].question}
                </h4>
                {interviewQuestions[activeQuestionIdx].hint && (
                  <p style={{ margin: 0, fontSize: "12px", color: "#facc15" }}>
                    💡 <strong>Pro Tip:</strong> {interviewQuestions[activeQuestionIdx].hint}
                  </p>
                )}
              </div>

              {/* User Answer Textarea */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Your Answer:
                </label>
                <textarea
                  rows={6}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your structured explanation, step-by-step logic, complexity, or STAR response..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "var(--input-bg, #0f172a)",
                    color: "var(--text, #fff)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEvaluateAnswer}
                  disabled={evaluatingAnswer || !userAnswer.trim()}
                  style={{ marginTop: "10px", padding: "10px 20px", fontSize: "13px" }}
                >
                  {evaluatingAnswer ? "⏳ Evaluating Answer..." : "🎯 Evaluate My Answer with AI"}
                </button>
              </div>

              {/* Evaluation Feedback */}
              {answerEvaluation && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: "12px",
                    padding: "18px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "16px" }}>📊 AI Evaluation Score:</h4>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: answerEvaluation.score >= 8 ? "#10b981" : answerEvaluation.score >= 6 ? "#f59e0b" : "#ef4444"
                      }}
                    >
                      {answerEvaluation.score} / {answerEvaluation.maxScore}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#e2e8f0" }}>{answerEvaluation.feedback}</p>

                  {answerEvaluation.strengths && answerEvaluation.strengths.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ fontSize: "12px", color: "#10b981" }}>Strengths:</strong>
                      <ul style={{ margin: "4px 0", paddingLeft: "20px", fontSize: "12px", color: "#cbd5e1" }}>
                        {answerEvaluation.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {answerEvaluation.improvements && answerEvaluation.improvements.length > 0 && (
                    <div>
                      <strong style={{ fontSize: "12px", color: "#f87171" }}>Areas to Improve:</strong>
                      <ul style={{ margin: "4px 0", paddingLeft: "20px", fontSize: "12px", color: "#cbd5e1" }}>
                        {answerEvaluation.improvements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <p style={{ fontSize: "32px", margin: "0 0 10px 0" }}>🎙️</p>
              <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>Ready for your mock interview?</h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px" }}>
                Select your target company and click "Generate Questions" above to practice high-frequency interview questions.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateInterview}
                style={{ padding: "10px 22px" }}
              >
                ⚡ Start Quick Mock Test
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SMART JOB FIT MATCHER */}
      {/* ======================================================== */}
      {activeTab === "matcher" && (
        <div className="section-card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>🎯 AI Job Compatibility & Upskilling Matcher</h3>
            <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
              Check match percentage against open campus recruitment drives and pinpoint specific skills to learn before applying.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Select Active Campus Job Opening:
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--input-bg, #1e293b)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px",
                  marginBottom: "16px"
                }}
              >
                {jobs.length > 0 ? (
                  jobs.map((j) => (
                    <option key={j._id || j.id} value={j._id || j.id}>
                      {j.company} - {j.title} ({j.salary || "Competitive"})
                    </option>
                  ))
                ) : (
                  <option value="sample_job">Google - Software Engineer (Full Stack)</option>
                )}
              </select>

              <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                Your Skills (Comma separated):
              </label>
              <input
                type="text"
                value={candidateSkillsInput}
                onChange={(e) => setCandidateSkillsInput(e.target.value)}
                placeholder="e.g. Python, React, Node.js, MongoDB, Git, SQL"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--input-bg, #0f172a)",
                  color: "var(--text, #fff)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px"
                }}
              />

              <button
                type="button"
                className="btn-primary"
                onClick={handleJobMatch}
                disabled={matchingJob}
                style={{ marginTop: "16px", width: "100%", padding: "12px", fontSize: "14px" }}
              >
                {matchingJob ? "⏳ Calculating AI Compatibility..." : "🔍 Check Job Match"}
              </button>
            </div>

            {/* Matcher Results */}
            {jobMatchResult ? (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Match Compatibility</span>
                    <h2
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "36px",
                        color: jobMatchResult.matchPercentage >= 70 ? "#10b981" : "#f59e0b"
                      }}
                    >
                      {jobMatchResult.matchPercentage}%
                    </h2>
                  </div>
                  <span
                    style={{
                      background: jobMatchResult.matchPercentage >= 70 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                      color: jobMatchResult.matchPercentage >= 70 ? "#10b981" : "#f59e0b",
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    {jobMatchResult.readinessTier}
                  </span>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981", display: "block", marginBottom: "4px" }}>
                    ✓ Matched Skills:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {jobMatchResult.matchedSkills.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#34d399",
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "6px"
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {jobMatchResult.missingSkills.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#f87171", display: "block", marginBottom: "4px" }}>
                      ⚡ Missing High-Priority Skills:
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {jobMatchResult.missingSkills.map((s) => (
                        <span
                          key={s}
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#fca5a5",
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobMatchResult.prepChecklist && jobMatchResult.prepChecklist.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                      📝 Recommended Preparation:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#cbd5e1" }}>
                      {jobMatchResult.prepChecklist.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: "4px" }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(15, 23, 42, 0.3)",
                  border: "1px dashed rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  padding: "30px",
                  textAlign: "center",
                  color: "#94a3b8"
                }}
              >
                <div>
                  <p style={{ fontSize: "28px", margin: "0 0 8px 0" }}>🎯</p>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    Click "Check Job Match" to run compatibility analysis against the selected job drive.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIHubSection;
