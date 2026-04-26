"use client";

import { PromptInput } from "@/components/PromptInput/PromptInput";
import styles from "./styles.module.css";
import React from "react";
import { useChat } from "@ai-sdk/react";
import { Message } from "@/components/Message/Message";

const AIChat = () => {
  const { messages, sendMessage } = useChat();

  const handleSendMessage = async (message: string) => {
    await sendMessage({ text: message });
  };

  return (
    <div className={styles["chat-container"]}>
      <div className={styles.messages}>
        {messages.map((message) => (
          <Message key={message.id} role={message.role} parts={message.parts} />
        ))}
      </div>

      <PromptInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export { AIChat };
