import { UIMessage } from "ai";
import styles from "./Message.module.css"

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
    <p className={`${styles.message} ${className}`}>
      {parts.map((part) => {
        if (part.type === "text") {
          return part.text;
        }
      })}
    </p>
  );
};

export { Message };
