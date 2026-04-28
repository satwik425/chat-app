import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://chat-app-7iby.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const messageEndRef = useRef(null);

  // ⭐ STARFIELD EFFECT
  useEffect(() => {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');

    function rand(min, max) { return Math.random() * (max - min) + min; }

    const stars = [];

    function initStars() {
      stars.length = 0;
      const count = Math.floor((canvas.width * canvas.height) / 800);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: rand(0, canvas.width),
          y: rand(0, canvas.height),
          r: rand(0.2, 1.8),
          alpha: rand(0.2, 1),
          twinkleSpeed: rand(0.003, 0.015),
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
          color: Math.random() > 0.85
            ? `rgba(180,200,255,`
            : Math.random() > 0.7
              ? `rgba(255,220,180,`
              : `rgba(255,255,255,`
        });
      }
    }

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + s.alpha + ')';
        ctx.fill();
      }
    }

    let animId;
    function animateStars() {
      for (const s of stars) {
        s.alpha += s.twinkleSpeed * s.twinkleDir;
        if (s.alpha >= 1) { s.alpha = 1; s.twinkleDir = -1; }
        if (s.alpha <= 0.1) { s.alpha = 0.1; s.twinkleDir = 1; }
      }
      drawStars();
      animId = requestAnimationFrame(animateStars);
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    }

    window.addEventListener('resize', resize);
    resize();
    animateStars();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // SOCKET EFFECTS
  useEffect(() => {
    socket.on("previous_messages", (data) => {
      setMessageList(data);
    });

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("previous_messages");
      socket.off("receive_message");
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const joinChat = () => {
    if (username !== "") {
      setShowChat(true);
    }
  };

  const sendMessage = () => {
    if (message !== "") {
      const messageData = {
        author: username,
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      socket.emit("send_message", messageData);
      setMessage("");
    }
  };

  return (
    <div className="App">
      <canvas id="starfield"></canvas>
      <div className="nebula"></div>      {/* ✅ fixed: class → className */}
      <div className="milkyway"></div>    {/* ✅ fixed: class → className */}

      {!showChat ? (
        /* JOIN SCREEN */
        <div className="join-container">
          <h3>Enter Your Name</h3>
          <input
            type="text"
            placeholder="John Doe..."
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinChat}>Join Chat</button>
        </div>
      ) : (
        /* CHAT SCREEN */
        <div className="chat-container">
          <div className="chat-header">
            <h3>Live Chat</h3>
          </div>

          <div className="chat-body">
            {messageList.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.author === username ? "me" : "other"}`}
              >
                <div className="message-content">
                  <p className="message-text">{msg.text}</p>
                </div>
                <div className="message-meta">
                  <span className="message-time">{msg.time}</span>
                  <span className="message-author">{msg.author}</span>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <div className="chat-footer">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;