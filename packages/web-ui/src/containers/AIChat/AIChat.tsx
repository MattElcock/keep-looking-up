"use client";

import { PromptInput } from "@/components/PromptInput/PromptInput";
import styles from "./styles.module.css";
import React, { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Message } from "@/components/Message/Message";

const AIChat = () => {
  const { messages, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    await sendMessage({ text: message });
  };

  return (
    <div className={styles["chat-container"]}>
      <div className={styles.messages}>
        {messages.map((message) => (
          <Message key={message.id} role={message.role} parts={message.parts} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles["prompt-wrapper"]}>
        <PromptInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export { AIChat };
