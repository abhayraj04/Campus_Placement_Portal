/**
 * AI Placement & Career Intelligence Controller
 * Supports Google Gemini API (if GEMINI_API_KEY is configured) and
 * falls back to an intelligent built-in placement heuristic reasoning engine.
 */

const https = require("https");

// --- Built-in Knowledge Base for Instant Fallback ---
const COMPANY_PROFILES = {
  google: {
    rounds: ["Online Assessment (DSA)", "Technical Round 1 (Trees/Graphs/DP)", "Technical Round 2 (System Design/DSA)", "Googliness & Leadership"],
    focus: "Data Structures & Algorithms, Scalability, Code Quality, Edge Case Handling",
    coreSkills: ["Python", "Java", "C++", "System Design", "Distributed Systems"]
  },
  amazon: {
    rounds: ["Online Assessment (Debugging + Coding + Work Style)", "Technical Round 1 (DSA + LP)", "Technical Round 2 (DSA + LP)", "Bar Raiser (System Design + Leadership Principles)"],
    focus: "16 Leadership Principles (Customer Obsession, Ownership, Bias for Action), Time & Space Complexity",
    coreSkills: ["Java", "AWS", "Object-Oriented Design", "Algorithms", "Microservices"]
  },
  microsoft: {
    rounds: ["Online Coding Test", "Technical Interview 1 (DSA/Problem Solving)", "Technical Interview 2 (OS/Networking/DBMS)", "HR / AA Round"],
    focus: "Clean Modular Code, Core CS Fundamentals (OS, DBMS, Computer Networks), Growth Mindset",
    coreSkills: ["C#", "C++", "Python", "Cloud/Azure", "Data Structures"]
  },
  tcs: {
    rounds: ["NQT (Numerical, Verbal, Reasoning, Coding)", "Technical Round", "Managerial & HR Round"],
    focus: "Aptitude, Core Java/C/Python, Final Year Project, Communication",
    coreSkills: ["SQL", "Java", "Python", "Web Technologies", "Basics of OOP"]
  },
  infosys: {
    rounds: ["InfyTQ / HackWithInfy / Aptitude Test", "Technical Interview", "HR Interview"],
    focus: "Aptitude speed, Database concepts, OOP fundamentals, Academic Projects",
    coreSkills: ["Java", "Python", "SQL", "HTML/CSS/JS", "Problem Solving"]
  }
};

const ROLE_KEYWORDS = {
  frontend: ["react", "javascript", "typescript", "html5", "css3", "redux", "tailwind", "responsive design", "rest api", "next.js", "vite", "webpack"],
  backend: ["node.js", "express", "mongodb", "postgresql", "sql", "restful api", "microservices", "docker", "jwt", "redis", "system design", "python"],
  fullstack: ["react", "node.js", "mongodb", "javascript", "typescript", "express", "rest api", "git", "docker", "aws", "sql", "tailwind"],
  data_analyst: ["python", "sql", "pandas", "numpy", "power bi", "tableau", "excel", "data visualization", "statistics", "machine learning"],
  cloud_devops: ["aws", "azure", "docker", "kubernetes", "ci/cd", "linux", "terraform", "bash", "git", "monitoring", "networking"]
};

// Helper: Call Google Gemini API if key is present
async function callGeminiAPI(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: 12000
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
            resolve(parsed.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(parsed.error?.message || "Invalid Gemini response"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Gemini API request timed out"));
    });

    req.write(data);
    req.end();
  });
}

// -------------------------------------------------------------
// 1. AI Placement & Career Copilot (Chat)
// -------------------------------------------------------------
exports.aiChat = async (req, res) => {
  try {
    const { message, context, role } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, message: "A message string is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const lowerMsg = message.toLowerCase();

    // 1. If Gemini API key is configured, use it
    if (apiKey) {
      try {
        const systemPrompt = `You are "PlacementBot", an elite AI campus placement coach and career advisor for university students and recruiters.
Context: User is a ${role || "student"}.
User Question: "${message}"

Give a concise, highly practical, and actionable answer (under 180 words). Include bullet points, concrete technical tips, or interview frameworks when applicable.`;
        const aiResponse = await callGeminiAPI(apiKey, systemPrompt);
        return res.status(200).json({
          success: true,
          reply: aiResponse,
          source: "gemini-ai"
        });
      } catch (geminiError) {
        console.warn("Gemini API error, falling back to built-in knowledge engine:", geminiError.message);
      }
    }

    // 2. Built-in Placement Intelligence Engine
    let reply = "";

    if (lowerMsg.includes("google") || lowerMsg.includes("faang") || lowerMsg.includes("maang")) {
      reply = `🎯 **FAANG / Google Interview Strategy**:
1. **DSA Mastery**: Focus on Medium/Hard LeetCode problems covering Dynamic Programming, Graphs (BFS/DFS), and Binary Trees.
2. **Communication**: Always communicate your thought process using the **REACTO** method (Repeat, Examples, Approach, Code, Test, Optimize).
3. **Behavioral**: Prepare 4-5 stories using the STAR method demonstrating innovation, conflict resolution, and handling ambiguity.`;
    } else if (lowerMsg.includes("resume") || lowerMsg.includes("ats")) {
      reply = `📄 **Top ATS Resume Principles**:
1. **Standard Headers**: Use standard sections ("Education", "Technical Skills", "Experience", "Projects").
2. **Quantify Impact**: Use the Google XYZ formula: *"Accomplished [X], as measured by [Y], by doing [Z]"* (e.g. *"Optimized database queries, reducing API response time by 42%"*).
3. **Format**: Single-column layout, standard font, no tables or images. Match key technologies directly with the job description.`;
    } else if (lowerMsg.includes("dsa") || lowerMsg.includes("leetcode") || lowerMsg.includes("coding")) {
      reply = `💡 **Essential DSA Placement Roadmap**:
- **Week 1-2**: Arrays, Two Pointers, Sliding Window & Hash Maps.
- **Week 3-4**: Linked Lists, Stacks, Queues, Binary Search.
- **Week 5-6**: Recursion, Backtracking, Trees (Traversal, BST, Height/Diameter).
- **Week 7-8**: Graphs (Dijkstra, Topological Sort) & Dynamic Programming (0/1 Knapsack, LCS).
- *Target*: 150-200 curated questions rather than random grinding!`;
    } else if (lowerMsg.includes("hr") || lowerMsg.includes("weakness") || lowerMsg.includes("introduce")) {
      reply = `🤝 **HR & Behavioral Round Tips**:
- **"Tell me about yourself"**: Structure with **Past** (Academics/Origins) ➔ **Present** (Current skills & proudest project) ➔ **Future** (Why this role & company excites you). Keep it under 90 seconds.
- **Weakness Question**: Mention a genuine area you are actively actively improving with concrete steps (e.g., public speaking or delegating tasks in team projects).`;
    } else if (lowerMsg.includes("amazon") || lowerMsg.includes("leadership")) {
      reply = `📦 **Amazon Interview Focus**:
- Amazon places 50% weight on their **16 Leadership Principles** (Customer Obsession, Bias for Action, Deliver Results, Earn Trust).
- Every technical interview will have 1-2 LP questions. Have 2 distinct STAR stories prepared for each principle.`;
    } else if (lowerMsg.includes("tcs") || lowerMsg.includes("infosys") || lowerMsg.includes("wipro") || lowerMsg.includes("service")) {
      reply = `🏢 **Service-Based Company Strategy (TCS, Infosys, Wipro)**:
1. **Aptitude Test**: Practice Speed Math, Profit & Loss, Syllogisms, and Coding fundamentals (Loops, Arrays, String manipulation).
2. **Technical Round**: Deep knowledge of your academic project, OOPs concepts (Inheritance, Polymorphism), and SQL queries (Joins, Aggregations).
3. **Confidence**: Clear English communication and willingness to learn new technologies.`;
    } else if (lowerMsg.includes("system design") || lowerMsg.includes("high level")) {
      reply = `🏗️ **System Design Fundamentals for Campus Hires**:
- Understand **Client-Server Architecture**, **Load Balancing**, **Horizontal vs. Vertical Scaling**.
- Know when to choose **SQL vs. NoSQL** (ACID transactions vs. flexible schema & horizontal scale).
- Familiarize yourself with **Caching** (Redis) and **Message Queues** (Kafka/RabbitMQ).`;
    } else {
      reply = `👋 **Campus Placement Copilot Tips**:
- **Target Preparation**: Tailor your resume keywords to the exact job role you are targeting.
- **Practice Mock Tests**: Take frequent timed aptitude and technical quizzes under pressure.
- **Project Demonstrations**: Ensure your GitHub repositories have informative READMEs, live demo links, and clean architecture.
Feel free to ask me about specific companies (Google, Amazon, TCS), resume optimization, or mock interview questions!`;
    }

    return res.status(200).json({
      success: true,
      reply,
      source: "placement-intelligence-engine"
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ success: false, message: "AI chat service error: " + error.message });
  }
};

// -------------------------------------------------------------
// 2. AI Resume & ATS Analyzer
// -------------------------------------------------------------
exports.aiAnalyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole, skills } = req.body;

    if (!resumeText && (!skills || skills.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Resume text or skills list is required for analysis."
      });
    }

    const text = (resumeText || "").toLowerCase();
    const roleKey = (targetRole || "fullstack").toLowerCase().replace(/[\s-]/g, "_");
    const targetKeywords = ROLE_KEYWORDS[roleKey] || ROLE_KEYWORDS.fullstack;

    // Check matched vs missing keywords
    const matchedKeywords = targetKeywords.filter((kw) => text.includes(kw));
    const missingKeywords = targetKeywords.filter((kw) => !text.includes(kw));

    // Metric / Quantification check
    const hasNumbersOrMetrics = /\b(\d+[%kKmM]?|\$\d+|\d+\+?)\b/.test(text);
    const metricMatches = (text.match(/\b\d+[%kK]?\b/g) || []).length;

    // Action verbs check
    const actionVerbs = ["developed", "built", "designed", "optimized", "implemented", "reduced", "increased", "spearheaded", "engineered", "created", "integrated"];
    const foundVerbs = actionVerbs.filter((v) => text.includes(v));

    // Calculate intelligent ATS Score (0 - 100)
    let score = 45; // baseline
    score += Math.min(matchedKeywords.length * 4, 30);
    score += Math.min(foundVerbs.length * 2, 12);
    if (hasNumbersOrMetrics) score += 10;
    if (text.length > 250) score += 5;
    score = Math.min(Math.max(score, 35), 98);

    // Generate intelligent rewrite suggestions & actionable feedback
    const suggestions = [];
    if (missingKeywords.length > 0) {
      suggestions.push({
        type: "keywords",
        title: "Missing High-Impact Industry Keywords",
        detail: `Consider naturally incorporating: ${missingKeywords.slice(0, 5).map((k) => `"${k}"`).join(", ")}.`
      });
    }

    if (metricMatches < 2) {
      suggestions.push({
        type: "metrics",
        title: "Quantify Your Accomplishments",
        detail: `Add metrics to project bullet points. For example: "Improved page load speed by 35%" or "Managed a dataset of 10,000+ entries".`
      });
    }

    suggestions.push({
      type: "formula",
      title: "Google XYZ Formula Improvement",
      before: "Worked on authentication and built login for users.",
      after: "Engineered secure JWT-based multi-role authentication system, reducing unauthorized session dropouts by 40%."
    });

    return res.status(200).json({
      success: true,
      atsScore: score,
      targetRole: targetRole || "Full Stack Developer",
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 6),
      suggestions,
      actionVerbsCount: foundVerbs.length,
      metricCount: metricMatches
    });
  } catch (error) {
    console.error("AI Resume analysis error:", error);
    res.status(500).json({ success: false, message: "Resume analysis error: " + error.message });
  }
};

// -------------------------------------------------------------
// 3. AI Mock Interview Question Generator
// -------------------------------------------------------------
exports.aiGenerateInterview = async (req, res) => {
  try {
    const { role, company, difficulty } = req.body;
    const targetRole = role || "Full Stack Developer";
    const targetCompany = company || "Top Tech";
    const level = difficulty || "medium";

    const questionBanks = {
      technical: [
        {
          id: "q1",
          category: "Data Structures & Algorithms",
          question: `Explain how you would find the longest substring without repeating characters in O(n) time. What data structures would you use?`,
          hint: "Think about the sliding window technique combined with a hash map or integer array for character tracking."
        },
        {
          id: "q2",
          category: "System Design & Architecture",
          question: `How would you design a scalable notification system that sends real-time email and push alerts for campus placement drives?`,
          hint: "Consider using message queues (e.g. RabbitMQ/Kafka), decoupled workers, and exponential backoff retry mechanisms."
        },
        {
          id: "q3",
          category: "Web & Core Concepts",
          question: `What is the difference between SQL and NoSQL databases, and how do you decide which one to use for a job application tracking portal?`,
          hint: "Contrast relational schemas, ACID guarantees, and joins with horizontal scalability, document flexibility, and read speeds."
        }
      ],
      behavioral: [
        {
          id: "q4",
          category: "Behavioral & Leadership",
          question: `Describe a situation where a technical project did not go as planned or a deadline was tight. How did you prioritize and deliver?`,
          hint: "Structure your response using the STAR method (Situation, Task, Action, Result), focusing on your specific actions and lessons learned."
        },
        {
          id: "q5",
          category: "Problem Solving & Conflict",
          question: `Tell me about a time you disagreed with a teammate or team lead regarding an engineering decision. How did you resolve it?`,
          hint: "Emphasize data-driven rationale, active listening, and committing to the final team decision."
        }
      ]
    };

    return res.status(200).json({
      success: true,
      role: targetRole,
      company: targetCompany,
      difficulty: level,
      questions: [...questionBanks.technical, ...questionBanks.behavioral]
    });
  } catch (error) {
    console.error("Generate interview error:", error);
    res.status(500).json({ success: false, message: "Interview generation error: " + error.message });
  }
};

// -------------------------------------------------------------
// 4. AI Mock Interview Answer Evaluation
// -------------------------------------------------------------
exports.aiEvaluateInterview = async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "Question and answer are required." });
    }

    const answerLower = answer.toLowerCase();
    const wordCount = answer.trim().split(/\s+/).length;

    let score = 5;
    const strengths = [];
    const improvements = [];

    // Length and depth analysis
    if (wordCount >= 40) {
      score += 2;
      strengths.push("Good depth and explanation detail.");
    } else {
      improvements.push("Answer is brief; provide more technical context, real-world examples, or edge cases.");
    }

    // Keyword detection
    const technicalTerms = ["time complexity", "space complexity", "hashmap", "queue", "cache", "scale", "latency", "star", "result", "action", "architecture"];
    const foundTerms = technicalTerms.filter((term) => answerLower.includes(term));
    if (foundTerms.length > 0) {
      score += 2;
      strengths.push(`Applied relevant concepts: ${foundTerms.join(", ")}.`);
    } else {
      improvements.push("Mention time/space complexity or system tradeoffs explicitly.");
    }

    score = Math.min(Math.max(score, 3), 10);

    return res.status(200).json({
      success: true,
      score,
      maxScore: 10,
      feedback: score >= 8 ? "Excellent response! Shows strong conceptual clarity and maturity." : (score >= 6 ? "Solid answer with clear fundamentals. Review the recommended additions to make it stand out." : "Good attempt. Expand your response with structured frameworks and technical specifics."),
      strengths,
      improvements,
      modelAnswerTip: "Best practices: Begin with a high-level summary, explain the step-by-step logic, state time/space complexity, and discuss potential optimizations or edge cases."
    });
  } catch (error) {
    console.error("Evaluate interview error:", error);
    res.status(500).json({ success: false, message: "Interview evaluation error: " + error.message });
  }
};

// -------------------------------------------------------------
// 5. AI Job Fit Matcher
// -------------------------------------------------------------
exports.aiJobMatch = async (req, res) => {
  try {
    const { candidateSkills = [], jobSkills = [], jobTitle = "" } = req.body;

    const candNormalized = (candidateSkills || []).map((s) => String(s).toLowerCase().trim());
    const jobNormalized = (jobSkills || []).map((s) => String(s).toLowerCase().trim());

    if (jobNormalized.length === 0) {
      return res.status(200).json({
        success: true,
        matchPercentage: 85,
        matchedSkills: candNormalized,
        missingSkills: [],
        recommendation: "Your profile shows general alignment for this position."
      });
    }

    const matched = jobNormalized.filter((js) => candNormalized.some((cs) => cs.includes(js) || js.includes(cs)));
    const missing = jobNormalized.filter((js) => !candNormalized.some((cs) => cs.includes(js) || js.includes(cs)));

    const matchPercentage = Math.round((matched.length / jobNormalized.length) * 100);

    return res.status(200).json({
      success: true,
      jobTitle,
      matchPercentage: Math.max(matchPercentage, 25),
      matchedSkills: matched,
      missingSkills: missing,
      readinessTier: matchPercentage >= 75 ? "High Fit - Ready to Interview" : (matchPercentage >= 50 ? "Moderate Fit - Review Missing Topics" : "Developing Fit - Upskilling Recommended"),
      prepChecklist: missing.map((skill) => `Build or practice a mini-project showcasing ${skill}`)
    });
  } catch (error) {
    console.error("Job match error:", error);
    res.status(500).json({ success: false, message: "Job match error: " + error.message });
  }
};
