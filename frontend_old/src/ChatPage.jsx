import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

export default function ChatPage() {
  const [sender, setSender] = useState("Alice"); // temp username
  const [receiver, setReceiver] = useState("Bob"); // chat target
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Fetch old messages
  useEffect(() => {
    axios
      .get(`http://localhost:3000/messages/${sender}/${receiver}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages:", err));

    // Listen for new incoming messages
    socket.on("receiveMessage", (msg) => {
      if (
        (msg.sender === sender && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === sender)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [sender, receiver]);

  // Send message
  const sendMessage = () => {
    if (message.trim()) {
      const msg = { sender, receiver, message };
      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, msg]);
      setMessage("");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💬 Talent Trade Chat</h2>
      <div style={styles.switch}>
        <input
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          placeholder="Your name"
          style={styles.input}
        />
        <input
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          placeholder="Chat with"
          style={styles.input}
        />
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf:
                msg.sender === sender ? "flex-end" : "flex-start",
              background:
                msg.sender === sender ? "#0078ff" : "#ddd",
              color: msg.sender === sender ? "white" : "black",
            }}
          >
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={styles.textInput}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} style={styles.sendBtn}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f4f4",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    marginBottom: 10,
  },
  switch: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  chatBox: {
    flex: 1,
    width: "90%",
    maxWidth: "600px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: "white",
    padding: "10px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  message: {
    padding: "8px 12px",
    borderRadius: "8px",
    maxWidth: "75%",
  },
  inputArea: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  textInput: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  sendBtn: {
    background: "#0078ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
  },
};
