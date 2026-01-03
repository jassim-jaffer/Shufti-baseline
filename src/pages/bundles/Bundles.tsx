import { createResource, type Component, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { FiDownload, FiTrash2, FiCompass, FiUser, FiPackage, FiCheck, FiCloud } from "solid-icons/fi";

import { useDB } from "../../db";
import styles from "./Bundles.module.css";

export const Bundles: Component = () => {
  const db = useDB();
  
  const [projects, { refetch }] = createResource(async () => {
    return await db.listProjects();
  });

  const handleDelete = async (id: string, title: string) => {
    const confirmed = confirm(`Delete "${title}"? This cannot be undone.`);
    if (confirmed) {
      await db.deleteProject(id);
      await refetch();
    }
  };

  return (
    <div class={styles.Container}>
      <div class={styles.Content}>
        <header class={styles.Header}>
          <h1>Your Bundles</h1>
          <p>Downloaded tours ready for offline use</p>
        </header>

        <Show when={projects.loading}>
          <div class={styles.Loading}>Loading...</div>
        </Show>

        <Show when={!projects.loading && projects()?.length === 0}>
          <div class={styles.EmptyState}>
            <FiPackage class={styles.EmptyIcon} />
            <h2>No Bundles Yet</h2>
            <p>Download tours from the Discover page to access them offline.</p>
            <A href="/" class={styles.DiscoverLink}>
              <FiCompass /> Go to Discover
            </A>
          </div>
        </Show>

        <Show when={!projects.loading && (projects()?.length || 0) > 0}>
          <div class={styles.BundleList}>
            <For each={projects()}>
              {project => (
                <div class={styles.BundleCard}>
                  <div class={styles.BundleInfo}>
                    <h3>{project.title}</h3>
                    <p>{project.tours.length} tour{project.tours.length !== 1 ? "s" : ""}</p>
                    <div class={styles.BundleStatus}>
                      <FiCheck class={styles.StatusIcon} />
                      <span>Available offline</span>
                    </div>
                  </div>
                  <div class={styles.BundleActions}>
                    <button 
                      class={styles.DeleteButton}
                      onClick={() => handleDelete(project.id, project.title)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <A href="/admin" class={styles.AdminLink}>
          <FiCloud /> Open Admin Panel
        </A>
      </div>

      <nav class={styles.BottomNav}>
        <A href="/" class={styles.NavItem}>
          <FiCompass />
          <span>Discover</span>
        </A>
        <A href="/profile" class={styles.NavItem}>
          <FiUser />
          <span>Profile</span>
        </A>
        <A href="/bundles" class={`${styles.NavItem} ${styles.NavItemActive}`}>
          <FiPackage />
          <span>Bundles</span>
        </A>
      </nav>
    </div>
  );
};
