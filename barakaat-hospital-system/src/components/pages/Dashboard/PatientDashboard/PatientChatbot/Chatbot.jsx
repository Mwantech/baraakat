import React, { useState, useEffect, useRef } from 'react';
import styles from './Chatbot.module.css';

const ChatApp = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Start session immediately when the component mounts
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/start_session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.status === 'success' && data.session_id) {
          setSessionId(data.session_id);
          // Optional: Add a welcome message
          setMessages([{ sender: 'bot', text: 'Welcome! I\'m here to help you check your symptoms. What are you experiencing?' }]);
        } else {
          console.error('Error starting session:', data.message);
          setMessages([{ sender: 'bot', text: 'Sorry, there was an error starting the session. Please refresh the page.' }]);
        }
      } catch (error) {
        console.error('Error starting session:', error);
        setMessages([{ sender: 'bot', text: 'Network error. Please check your connection.' }]);
      }
    };

    initializeSession();
  }, []); // Empty dependency array means this runs once on mount

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) {
      // Ensure both message and session exist
      return;
    }

    const userMessage = inputMessage;
    // Add user's message to chat history
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInputMessage('');

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage
        })
      });
      const data = await response.json();
      if (data.status === 'success' && data.response) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.response }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.message || 'Error processing message.' }]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error processing message.' }]);
    }
    setLoading(false);
  };

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
          <h2>Symptom Checker</h2>
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
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Type your symptoms or message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSendMessage} 
            disabled={loading || !sessionId}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;