import { createSignal, createResource, type Component, For, Show, onCleanup } from "solid-js";
import { A } from "@solidjs/router";
import { FiMapPin, FiClock, FiNavigation, FiVolume2, FiChevronRight, FiStar, FiUser, FiPackage, FiCompass, FiChevronLeft } from "solid-icons/fi";

import { useDB } from "../../db";
import { type StopModel } from "../../data";
import styles from "./Explore.module.css";
import shuftiLogo from "../../assets/shufti-logo.png";

interface TourCard {
  id: string;
  projectId: string;
  title: string;
  location: string;
  description: string;
  imageUrl: string | null;
  rating: number;
  duration: string;
  stopCount: number;
  audioPreview: string;
}

export const Explore: Component = () => {
  const db = useDB();
  const [currentIndex, setCurrentIndex] = createSignal(0);
  
  const [tours] = createResource(async () => {
    const projects = await db.listProjects();
    const tourCards: TourCard[] = [];
    
    for (const project of projects) {
      for (const tour of project.tours) {
        const stops = tour.route.filter((w): w is StopModel => w.type === "stop");
        const stopCount = stops.length;
        const estimatedDuration = Math.max(0.5, stopCount * 0.3);
        
        let imageUrl: string | null = null;
        const firstStopWithImage = stops.find(s => s.gallery && s.gallery.length > 0);
        if (firstStopWithImage && firstStopWithImage.gallery[0]) {
          const imageHash = firstStopWithImage.gallery[0];
          const asset = project.assets[imageHash];
          if (asset) {
            const blob = await db.loadAsset(imageHash);
            if (blob) {
              imageUrl = URL.createObjectURL(blob);
            }
          }
        }
        
        tourCards.push({
          id: tour.id,
          projectId: project.id,
          title: tour.title,
          location: "Oman",
          description: tour.desc || "Explore this self-guided audio tour",
          imageUrl,
          rating: 4.8,
          duration: `${estimatedDuration.toFixed(1)} hours`,
          stopCount,
          audioPreview: "Listen to a preview of this tour...",
        });
      }
    }
    
    return tourCards;
  });

  const [touchStart, setTouchStart] = createSignal<number | null>(null);
  const [touchEnd, setTouchEnd] = createSignal<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    const start = touchStart();
    const end = touchEnd();
    if (!start || !end) return;
    
    const distance = start - end;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const tourList = tours();
    if (!tourList || tourList.length === 0) return;
    
    if (isLeftSwipe && currentIndex() < tourList.length - 1) {
      setCurrentIndex(i => i + 1);
    } else if (isRightSwipe && currentIndex() > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const goNext = () => {
    const tourList = tours();
    if (tourList && currentIndex() < tourList.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex() > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const currentTour = () => {
    const tourList = tours();
    if (!tourList || tourList.length === 0) return null;
    return tourList[currentIndex()];
  };

  return (
    <div class={styles.Container}>
      <Show when={!tours.loading && tours()?.length === 0}>
        <div class={styles.EmptyState}>
          <img src={shuftiLogo} alt="Shufti" class={styles.Logo} />
          <h2>No Tours Yet</h2>
          <p>Add tours from the admin panel to see them here.</p>
          <A href="/admin" class={styles.AdminLink}>Go to Admin Panel</A>
        </div>
      </Show>

      <Show when={tours.loading}>
        <div class={styles.Loading}>
          <img src={shuftiLogo} alt="Shufti" class={styles.Logo} />
          <p>Loading tours...</p>
        </div>
      </Show>

      <Show when={currentTour()}>
        {tour => (
          <div 
            class={styles.TourCard}
            style={{ "background-image": tour().imageUrl ? `url(${tour().imageUrl})` : "linear-gradient(135deg, #2d5a27 0%, #1a3518 100%)" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div class={styles.CardOverlay}>
              <header class={styles.Header}>
                <div class={styles.BrandLine}>
                  <span class={styles.BrandAccent}></span>
                  <span class={styles.BrandName}>Shufti</span>
                </div>
                <button class={styles.MapButton}>
                  <FiMapPin />
                </button>
              </header>

              <div class={styles.CardContent}>
                <div class={styles.LocationLine}>
                  <span class={styles.LocationAccent}></span>
                  <span class={styles.LocationText}>{tour().location}</span>
                </div>

                <h1 class={styles.TourTitle}>{tour().title}</h1>

                <p class={styles.TourDescription}>{tour().description}</p>

                <div class={styles.AudioPreview}>
                  <button class={styles.AudioButton}>
                    <FiVolume2 />
                  </button>
                  <div class={styles.AudioInfo}>
                    <span class={styles.AudioLabel}>Audio Preview</span>
                    <span class={styles.AudioText}>{tour().audioPreview}</span>
                  </div>
                </div>

                <div class={styles.TourMeta}>
                  <div class={styles.MetaItem}>
                    <FiStar class={styles.MetaIconStar} />
                    <span>{tour().rating}</span>
                  </div>
                  <div class={styles.MetaItem}>
                    <FiClock />
                    <span>{tour().duration}</span>
                  </div>
                  <div class={styles.MetaItem}>
                    <FiNavigation />
                    <span>{tour().stopCount} stops</span>
                  </div>
                </div>

                <A href={`/admin/projects/${tour().projectId}/tours/${tour().id}`} class={styles.ExploreButton}>
                  Explore Tour <FiChevronRight />
                </A>

                <Show when={(tours()?.length || 0) > 1}>
                  <div class={styles.SwipeControls}>
                    <button 
                      class={styles.SwipeButton} 
                      onClick={goPrev}
                      disabled={currentIndex() === 0}
                    >
                      <FiChevronLeft />
                    </button>
                    <span class={styles.SwipeCount}>{currentIndex() + 1} / {tours()?.length}</span>
                    <button 
                      class={styles.SwipeButton} 
                      onClick={goNext}
                      disabled={currentIndex() === (tours()?.length || 1) - 1}
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </Show>

                <Show when={(tours()?.length || 0) > 1}>
                  <div class={styles.SwipeIndicator}>
                    <For each={tours()}>
                      {(_, i) => (
                        <span 
                          class={`${styles.Dot} ${i() === currentIndex() ? styles.DotActive : ""}`}
                          onClick={() => setCurrentIndex(i())}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        )}
      </Show>

      <nav class={styles.BottomNav}>
        <A href="/" class={`${styles.NavItem} ${styles.NavItemActive}`}>
          <FiCompass />
          <span>Discover</span>
        </A>
        <A href="/profile" class={styles.NavItem}>
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
