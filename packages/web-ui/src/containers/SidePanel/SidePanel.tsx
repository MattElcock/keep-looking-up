import styles from "./styles.module.css";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

const SidePanel = async () => {
  const user = await currentUser();

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
