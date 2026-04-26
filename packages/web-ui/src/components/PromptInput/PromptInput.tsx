"use client";

import styles from "./styles.module.css";
import { ArrowRight } from "lucide-react";
import { InputEvent, useRef } from "react";

interface ChatInputProps {
  id: string;
  label: string;
  className?: string;
}

const MAX_ROWS = 6;

const PromptInput = ({ id, label, className }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContainerClick = () => {
    textareaRef.current?.focus();
  };

  const handleInput = (e: InputEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";

    const lineHeight = 24;
    const maxHeight = lineHeight * MAX_ROWS;

    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  return (
    <div className={`${styles["prompt-input"]} ${className}`} onClick={handleContainerClick}>
      <textarea
        id={id}
        aria-label={label}
        ref={textareaRef}
        rows={1}
        aria-multiline
        onInput={handleInput}
        placeholder="Example: What could I see tonight?"
      />
      <button aria-label="Send">
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export { PromptInput };
