import styles from "./styles.module.css";
import { UserButton } from "@clerk/nextjs";

const SidePanel = async () => {
  return (
    <aside className={styles["side-panel"]}>
      <div className={styles["header"]}>
        <h1>Keep Looking Up</h1>
        <UserButton />
      </div>
    </aside>
  );
};

export { SidePanel };
