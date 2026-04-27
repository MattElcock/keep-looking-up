"use client";

import styles from "./styles.module.css";
import { ArrowRight } from "lucide-react";
import { InputEvent, SubmitEvent, useRef, useState } from "react";

interface PromptInputProps {
  onSendMessage: (message: string) => Promise<void>;
}

const PromptInput = ({ onSendMessage }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  const handleInput = (e: InputEvent<HTMLTextAreaElement>) => {
    setPrompt(e.currentTarget.value);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSendMessage(prompt);
    setPrompt("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles["prompt-input"]} onClick={handleContainerClick}>
        <textarea
          id="prompt-input"
          name="promptInput"
          value={prompt}
          aria-required
          required
          aria-label="Chat with the AI"
          placeholder="Example: What could I see tonight?"
          ref={textareaRef}
          rows={3}
          aria-multiline
          onInput={handleInput}
        />
        <button type="submit" aria-label="Send" disabled={!prompt.trim()}>
          <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
};

export { PromptInput };
