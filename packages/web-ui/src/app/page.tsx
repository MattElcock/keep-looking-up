import styles from "./page.module.css";
import { AIChat } from "@/containers/AIChat/AIChat";

export default function Home() {
  return (
    <main className={styles.page}>
      <AIChat />
    </main>
  );
}
