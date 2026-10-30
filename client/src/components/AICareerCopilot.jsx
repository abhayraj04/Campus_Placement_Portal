import { useState, useRef, useEffect } from "react";
import { aiChat } from "../services/api";
import { useAuth } from "../AuthContext";
import "./AICareerCopilot.css";

const QUICK_PROMPTS = [
  "🚀 FAANG Interview Tips",
  "📄 ATS Resume Formula",
  "💡 High-Yield DSA Topics",
  "🤝 'Tell Me About Yourself'",
  "🏢 Service vs Product Companies"
];

function AICareerCopilot() {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: `Hello ${user?.name ? user.name.split(" ")[0] : "there"}! 👋 I'm **PlacementBot**, your AI Career Copilot. Ask me about interview strategies, resume optimization, coding roadmaps, or placement tips!`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await aiChat({
        message: textToSend.trim(),
        role: role || "student"
      });

      const replyText = res.reply || res.message || "I'm ready to help with your placement preparation!";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: replyText
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ PlacementBot is currently connecting. Check your internet or try another question!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render basic markdown bold/bullets
  const renderFormattedText = (raw) => {
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      // Bold replace
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return (
        <span
          key={idx}
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ display: "block", marginBottom: line === "" ? "6px" : "2px" }}
        />
      );
    });
  };

  return (
    <>
      <button
        type="button"
        className="ai-copilot-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Career Copilot"
      >
        <span>🤖</span>
        <span className="ai-copilot-badge">AI</span>
      </button>

      {isOpen && (
        <div className="ai-copilot-modal">
          <div className="ai-copilot-header">
            <div className="ai-copilot-header-info">
              <div className="ai-copilot-avatar">✨</div>
              <div>
                <h4>AI Career Copilot</h4>
                <span>Placement & Interview Advisor</span>
              </div>
            </div>
            <button
              type="button"
              className="ai-copilot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="ai-copilot-pills">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-copilot-pill"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="ai-copilot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ${m.sender}`}>
                {renderFormattedText(m.text)}
              </div>
            ))}
            {loading && (
              <div className="ai-copilot-typing">
                <div className="ai-copilot-dot" />
                <div className="ai-copilot-dot" />
                <div className="ai-copilot-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="ai-copilot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask placement questions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AICareerCopilot;
