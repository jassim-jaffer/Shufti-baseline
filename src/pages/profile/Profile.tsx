import { type Component } from "solid-js";
import { A } from "@solidjs/router";
import { FiUser, FiSettings, FiDownload, FiHelpCircle, FiLogOut, FiChevronRight, FiCompass, FiPackage } from "solid-icons/fi";

import styles from "./Profile.module.css";

export const Profile: Component = () => {
  return (
    <div class={styles.Container}>
      <div class={styles.Content}>
        <header class={styles.Header}>
          <div class={styles.Avatar}>
            <FiUser />
          </div>
          <h1>Your Profile</h1>
          <p>Manage your account and preferences</p>
        </header>

        <div class={styles.MenuSection}>
          <button class={styles.MenuItem}>
            <FiDownload />
            <span>Downloaded Tours</span>
            <FiChevronRight class={styles.Chevron} />
          </button>
          <button class={styles.MenuItem}>
            <FiSettings />
            <span>Settings</span>
            <FiChevronRight class={styles.Chevron} />
          </button>
          <button class={styles.MenuItem}>
            <FiHelpCircle />
            <span>Help & Support</span>
            <FiChevronRight class={styles.Chevron} />
          </button>
        </div>

        <div class={styles.MenuSection}>
          <A href="/admin" class={styles.MenuItem}>
            <FiPackage />
            <span>Admin Panel</span>
            <FiChevronRight class={styles.Chevron} />
          </A>
        </div>

        <button class={styles.LogoutButton}>
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </div>

      <nav class={styles.BottomNav}>
        <A href="/" class={styles.NavItem}>
          <FiCompass />
          <span>Discover</span>
        </A>
        <A href="/profile" class={`${styles.NavItem} ${styles.NavItemActive}`}>
          <FiUser />
          <span>Profile</span>
        </A>
        <A href="/bundles" class={styles.NavItem}>
          <FiPackage />
          <span>Bundles</span>
        </A>
      </nav>
    </div>
  );
};
