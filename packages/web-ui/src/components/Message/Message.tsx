import { UIMessage } from "ai";
import styles from "./Message.module.css"
import Markdown from 'react-markdown'

interface MessageProps extends Pick<UIMessage, "parts" | "role"> {}

const Message = ({ role, parts }: MessageProps) => {
  let className: string;

  if (role === "user") {
    className = styles["user-message"];
  } else if (role === "assistant") {
    className = styles["assistant-message"];
  } else {
    className = "message-system";
  }

  return (
    <div className={`${styles.message} ${className}`}>
      {parts.map((part) => {
        if (part.type === "text") {
          return <Markdown>{part.text}</Markdown>
        }
      })}
    </div>
  );
};

export { Message };
