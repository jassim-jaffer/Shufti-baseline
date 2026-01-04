import { createSignal, createResource, type Component, Show, For } from "solid-js";
import { A, useParams } from "@solidjs/router";
import { FiArrowLeft, FiMapPin, FiClock, FiNavigation, FiDownload, FiPlay } from "solid-icons/fi";

import { useDB } from "../../db";
import { type StopModel } from "../../data";
import styles from "./TourDetails.module.css";

export const TourDetails: Component = () => {
  const params = useParams();
  const db = useDB();
  const [mapExpanded, setMapExpanded] = createSignal(false);

  const [tourData] = createResource(async () => {
    const projects = await db.listProjects();
    const project = projects.find(p => p.id === params.projectId);
    if (!project) return null;
    
    const tour = project.tours.find(t => t.id === params.tourId);
    if (!tour) return null;

    const route = tour.route || [];
    const stops = route.filter((w): w is StopModel => w.type === "stop");
    const stopCount = stops.length;
    const estimatedDuration = Math.max(0.5, stopCount * 0.3);

    return {
      project,
      tour,
      stops,
      stopCount,
      duration: `${estimatedDuration.toFixed(1)} hours`,
    };
  });

  const handleComingSoon = () => {
    alert("Premium tours coming soon! For now, enjoy this tour for free.");
  };

  const handleDownload = () => {
    alert("Download feature coming to the mobile app! Use the Shufti Player app to download tours for offline use.");
  };

  return (
    <div class={styles.Container}>
      <Show when={tourData.loading}>
        <div class={styles.Loading}>Loading tour...</div>
      </Show>

      <Show when={!tourData.loading && !tourData()}>
        <div class={styles.NotFound}>
          <h2>Tour not found</h2>
          <A href="/" class={styles.BackLink}>Back to Explore</A>
        </div>
      </Show>

      <Show when={tourData()}>
        {data => (
          <>
            <header class={styles.Header}>
              <A href="/" class={styles.BackButton}>
                <FiArrowLeft />
              </A>
              <h1 class={styles.HeaderTitle}>{data().tour.title}</h1>
              <div class={styles.HeaderSpacer}></div>
            </header>

            <div class={styles.Content}>
              <div 
                class={`${styles.MapPreview} ${mapExpanded() ? styles.MapExpanded : ""}`}
                onClick={() => setMapExpanded(!mapExpanded())}
              >
                <div class={styles.MapPlaceholder}>
                  <FiMapPin size={32} />
                  <span>Map Preview</span>
                  <span class={styles.MapHint}>
                    {mapExpanded() ? "Tap to minimize" : "Tap to expand"}
                  </span>
                </div>
                <Show when={data().stops.length > 0}>
                  <div class={styles.StopPins}>
                    <For each={data().stops.slice(0, 5)}>
                      {(stop, index) => (
                        <div class={styles.PinMarker} style={{ left: `${20 + index() * 15}%` }}>
                          <span class={styles.PinNumber}>{index() + 1}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              <div class={styles.TourInfo}>
                <div class={styles.Location}>
                  <span class={styles.LocationDot}></span>
                  <span>Oman</span>
                </div>

                <h2 class={styles.TourTitle}>{data().tour.title}</h2>
                <p class={styles.TourDescription}>
                  {data().tour.desc || "Explore this self-guided audio tour with GPS navigation and immersive narration."}
                </p>

                <div class={styles.Stats}>
                  <div class={styles.StatItem}>
                    <span class={styles.StatValue}>{data().stopCount}</span>
                    <span class={styles.StatLabel}>Stops</span>
                  </div>
                  <div class={styles.StatDivider}></div>
                  <div class={styles.StatItem}>
                    <span class={styles.StatValue}>{data().duration}</span>
                    <span class={styles.StatLabel}>Duration</span>
                  </div>
                  <div class={styles.StatDivider}></div>
                  <div class={styles.StatItem}>
                    <span class={styles.StatValue}>Free</span>
                    <span class={styles.StatLabel}>Price</span>
                  </div>
                </div>

                <div class={styles.StopsSection}>
                  <h3 class={styles.SectionTitle}>Tour Stops</h3>
                  <Show when={data().stops.length > 0} fallback={
                    <p class={styles.NoStops}>Tour stops will appear here</p>
                  }>
                    <For each={data().stops}>
                      {(stop, index) => (
                        <div class={styles.StopItem}>
                          <div class={styles.StopNumber}>{index() + 1}</div>
                          <div class={styles.StopInfo}>
                            <span class={styles.StopTitle}>{stop.title}</span>
                            <Show when={stop.desc}>
                              <span class={styles.StopDesc}>{stop.desc}</span>
                            </Show>
                          </div>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            </div>

            <footer class={styles.Footer}>
              <button class={styles.PurchaseButton} onClick={handleComingSoon}>
                <span class={styles.PriceStrike}>$4.99</span>
                <span class={styles.PremiumLabel}>Premium</span>
              </button>
              <button class={styles.DownloadButton} onClick={handleDownload}>
                <FiDownload />
                <span>Get Free Tour</span>
              </button>
            </footer>
          </>
        )}
      </Show>
    </div>
  );
};
