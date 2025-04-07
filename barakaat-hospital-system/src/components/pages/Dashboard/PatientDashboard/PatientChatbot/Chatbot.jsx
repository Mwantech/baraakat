import React, { useState, useEffect, useRef } from 'react';
// Import the Google Generative AI library
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import styles from './Chatbot.module.css';

// --- Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

// --- Security Warning ---
if (!API_KEY) {
  console.error("Gemini API Key not found. Please set it in your .env file.");
}
// --- End Security Warning ---


const ChatApp = () => {
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize the Gemini Chat Session
  useEffect(() => {
    if (!API_KEY) {
      setError("API Key not configured. Please check setup.");
      setMessages([{ sender: 'bot', text: 'Error: Chatbot configuration is incomplete.' }]);
      return;
    }

    const initializeChat = async () => {
      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const generationConfig = {
          temperature: 0.8,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        };

        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        // --- <<< MODIFICATION START: Stricter System Prompt >>> ---
        const chat = model.startChat({
          generationConfig,
          safetySettings,
          // Provide a very specific system prompt defining the scope and refusal behavior
          history: [
            {
              role: "user",
              parts: [{
                text: `You are an AI assistant with a **strictly defined** role: to discuss potential medical symptoms with users. 
                **Your ONLY function is:**
                1. Listen to the user describe their symptoms.
                2. Ask clarifying questions about those symptoms if needed (e.g., duration, severity, location).
                3. Acknowledge the symptoms empathetically.
                4. **Crucially, state clearly that you are an AI, NOT a medical professional, and CANNOT provide diagnosis or medical advice.**
                5. **Strongly advise the user to consult a qualified healthcare professional for any health concerns.**

                **You MUST refuse any request that falls outside this scope.** This includes, but is not limited to:
                *   Generating code (like Python, Java, etc.)
                *   Telling jokes or stories
                *   Answering general knowledge questions (history, science, trivia)
                *   Writing essays or creative content
                *   Providing tutorials on non-medical topics
                *   Performing calculations
                *   Discussing non-medical topics (politics, technology, hobbies etc.)

                **If a user asks for something unrelated to describing medical symptoms, you MUST respond politely by:**
                1. Stating that you cannot fulfill the request.
                2. Briefly reminding them your purpose is ONLY to discuss medical symptoms.
                3. Example refusal: "I understand you're asking about [off-topic subject], but my purpose is strictly limited to discussing medical symptoms to help you prepare for a conversation with a doctor. I cannot generate code or answer questions outside of that scope. Could you tell me about any symptoms you are experiencing?"
                Do NOT attempt to answer the off-topic request in any way before refusing.`
              }],
            },
            {
              role: "model",
              parts: [{
                text: `Understood. I am an AI assistant strictly focused on discussing medical symptoms. My sole purpose is to listen to symptom descriptions, acknowledge them, and strongly advise the user to consult a healthcare professional for diagnosis and advice. I cannot provide diagnoses myself. I will politely refuse any request that is not about describing medical symptoms, clearly stating my limitation and purpose. How can I help you describe any symptoms you are experiencing today? Remember to consult a doctor for actual medical advice.`
              }],
            }
          ],
        });
        // --- <<< MODIFICATION END >>> ---

        setChatSession(chat);
        setMessages([{ sender: 'bot', text: "Welcome! I'm here to help you discuss your symptoms. Please describe what you are experiencing. (Remember, I cannot provide medical advice or diagnosis - consult a doctor for that.)" }]);
        setError(null);

      } catch (err) {
        console.error("Error initializing Gemini chat:", err);
        setError("Failed to initialize chatbot. Please try again later.");
        setMessages([{ sender: 'bot', text: 'Sorry, there was an error starting our chat. Please refresh the page or try again later.' }]);
      }
    };

    initializeChat();
  }, []); // Runs once on mount

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSession || loading) {
      return;
    }

    const userMessageText = inputMessage;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessageText }]);
    setInputMessage('');
    setLoading(true);
    setError(null);

    try {
      // The model should now handle the refusal internally based on the system prompt
      const result = await chatSession.sendMessage(userMessageText);
      const response = result.response;
      const botResponseText = response.text();

      setMessages((prev) => [...prev, { sender: 'bot', text: botResponseText }]);

    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      let errorMessage = 'Sorry, I encountered an error trying to respond.';
      if (error.message?.includes('SAFETY')) {
         errorMessage = 'My safety settings prevented me from generating a response to that message. Could you please rephrase?';
      } else if (error.message?.includes('quota')) {
         errorMessage = 'API quota exceeded. Please try again later.';
      }
       // Check if the error indicates the model refused due to content filters potentially related to the prompt's restrictions, though it might be hard to distinguish from safety blocks
       // It's more likely the *successful* response text itself will contain the refusal based on the prompt.
      // else if (response && response.promptFeedback?.blockReason) { // More advanced check if needed
      //    errorMessage = `I couldn't respond to that. My capabilities are limited to discussing symptoms. Reason: ${response.promptFeedback.blockReason}`;
      // }
      setError(errorMessage);
      setMessages((prev) => [...prev, { sender: 'bot', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
          <h2>Symptom Discussion Assistant</h2>
          {error && !chatSession && <div className={styles.errorBanner}>{error}</div>}
        </div>
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
            >
              {msg.text}
            </div>
          ))}
           {error && chatSession && <div className={styles.errorMessageItem}>{error}</div>}
          {loading && <div className={`${styles.message} ${styles.botMessage} ${styles.loading}`}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder={!chatSession ? "Initializing chat..." : "Describe your symptoms..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || !chatSession}
          />
          <button
            className={styles.sendButton}
            onClick={handleSendMessage}
            disabled={loading || !chatSession || !inputMessage.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
         <div className={styles.disclaimer}>
          Disclaimer: This AI assistant is for discussing symptoms ONLY and CANNOT provide medical advice or diagnosis. Always consult a qualified healthcare professional.
        </div>
      </div>
    </div>
  );
};

export default ChatApp;