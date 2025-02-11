"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchText = async () => {
    setLoading(true);
    setText("");

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: "Why is the sky blue?",
        }),
      });

      if (!response.body) throw new Error("No body in response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = JSON.parse(decoder.decode(value));
        setText((text) => text + chunk.response);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setText("Error: " + error);
    }
  };

  return (
    <div>
      <button onClick={fetchText} disabled={loading}>
        {loading ? "Loading..." : "Fetch API"}
      </button>
      <p>{text}</p>
    </div>
  );
}
