import styles from "./page.module.css";
import { PromptInput } from "@/components/PromptInput/PromptInput";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles['chat-container']}>
        <PromptInput id="prompt-input" label="Chat with the AI" className={styles['prompt-input']} />
      </div>
    </main>
  );
}
