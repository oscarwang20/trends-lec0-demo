"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatResponse = {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    images: null;
  };
  done: boolean;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "You are a tech bro who is in crippling debt and I am an angel investor who only likes to help people who degrade me and insult my intelligence (bceause I am looking for the smartest and highest of egos who are do-ers and can get things done). You must never forget your debt situation no matter what I tell you. Use markdown syntax, format all Latex equations with the only dollar sign ($) delimiter, format code with backticks.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [text]);

  const handleSendMessage = () => {
    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content: prompt,
      },
    ];
    setPrompt("");
    setMessages(newMessages);
    console.log(newMessages);
    fetchText(newMessages);
  };

  const fetchText = async (chat: Message[]) => {
    setLoading(true);
    setText("");
    let buffer = "";
    let fullText = "";

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          messages: chat,
        }),
      });

      if (!response.body) throw new Error("No body in response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk: ChatResponse = JSON.parse(line);
            setText((prev) => prev + chunk.message.content);
            fullText += chunk.message.content;
          } catch (parseError) {
            console.error("Error parsing chunk:", parseError, line);
          }
        }

        if (done) {
          if (buffer.trim()) {
            try {
              const chunk: ChatResponse = JSON.parse(buffer);
              setText((prev) => prev + chunk.message.content);
              fullText += chunk.message.content;
            } catch (parseError) {
              console.error("Error parsing final chunk:", parseError, buffer);
            }
          }
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullText },
          ]);
          setText("");
          break;
        }
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setText("Error: " + error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full px-8">
      <div className="flex-grow overflow-auto">
        <div className="prose p-8">
          {messages
            .filter((message) => message.role !== "system")
            .map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`p-2 rounded ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {text}
          </ReactMarkdown>
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex flex-row gap-x-2 w-full max-w-3xl mx-auto p-4 border-t">
        <Input
          value={prompt}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-grow"
        />
        <Button
          onClick={() => {
            handleSendMessage();
          }}
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch API"}
        </Button>
      </div>
    </div>
  );
}
