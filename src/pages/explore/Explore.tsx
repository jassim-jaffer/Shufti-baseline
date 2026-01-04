import { createSignal, createResource, type Component, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { FiMapPin, FiClock, FiNavigation, FiVolume2, FiChevronRight, FiStar, FiUser, FiPackage, FiCompass } from "solid-icons/fi";

import { useDB } from "../../db";
import { type StopModel } from "../../data";
import styles from "./Explore.module.css";
import shuftiLogo from "../../assets/shufti-logo.png";
import muttrahImage from "../../assets/muttrah-cover.jpg";

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
  const [dragOffset, setDragOffset] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const [isAnimating, setIsAnimating] = createSignal(false);
  
  const [tours] = createResource(async () => {
    const projects = await db.listProjects();
    const tourCards: TourCard[] = [];
    
    for (const project of projects) {
      for (const tour of project.tours) {
        const route = tour.route || [];
        const stops = route.filter((w): w is StopModel => w.type === "stop");
        const stopCount = stops.length;
        const estimatedDuration = Math.max(0.5, stopCount * 0.3);
        
        let imageUrl: string | null = null;
        
        if (tour.title.toLowerCase().includes("muttrah")) {
          imageUrl = muttrahImage;
        } else {
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

  let touchStartX = 0;
  let touchStartY = 0;
  const swipeThreshold = 80;

  const handleTouchStart = (e: TouchEvent) => {
    if (isAnimating()) return;
    touchStartX = e.targetTouches[0].clientX;
    touchStartY = e.targetTouches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging() || isAnimating()) return;
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = Math.abs(currentY - touchStartY);
    
    if (Math.abs(deltaX) > deltaY) {
      e.preventDefault();
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging() || isAnimating()) return;
    setIsDragging(false);
    
    const offset = dragOffset();
    const tourList = tours();
    if (!tourList || tourList.length === 0) {
      setDragOffset(0);
      return;
    }

    if (offset < -swipeThreshold && currentIndex() < tourList.length - 1) {
      animateSwipe("left");
    } else if (offset > swipeThreshold && currentIndex() > 0) {
      animateSwipe("right");
    } else {
      setDragOffset(0);
    }
  };

  const animateSwipe = (direction: "left" | "right") => {
    setIsAnimating(true);
    const targetOffset = direction === "left" ? -window.innerWidth : window.innerWidth;
    setDragOffset(targetOffset);
    
    setTimeout(() => {
      if (direction === "left") {
        setCurrentIndex(i => i + 1);
      } else {
        setCurrentIndex(i => i - 1);
      }
      setDragOffset(0);
      setIsAnimating(false);
    }, 250);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (isAnimating()) return;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || isAnimating()) return;
    const deltaX = e.clientX - touchStartX;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging()) {
      handleTouchEnd();
    }
  };

  const currentTour = () => {
    const tourList = tours();
    if (!tourList || tourList.length === 0) return null;
    return tourList[currentIndex()];
  };

  const getCardStyle = () => {
    const offset = dragOffset();
    const rotation = offset * 0.02;
    const scale = 1 - Math.abs(offset) * 0.0002;
    const opacity = 1 - Math.abs(offset) * 0.001;
    
    return {
      transform: `translateX(${offset}px) rotate(${rotation}deg) scale(${Math.max(0.95, scale)})`,
      opacity: Math.max(0.7, opacity),
      transition: isDragging() ? "none" : "transform 0.25s ease-out, opacity 0.25s ease-out",
    };
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
            style={{ 
              "background-image": tour().imageUrl ? `url(${tour().imageUrl})` : "linear-gradient(135deg, #2d5a27 0%, #1a3518 100%)",
              ...getCardStyle()
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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

              <Show when={(tours()?.length || 0) > 1}>
                <div class={styles.SwipeHint}>
                  <span class={styles.SwipeArrow}>&#8592;</span>
                  <span class={styles.SwipeText}>Swipe to explore</span>
                  <span class={styles.SwipeArrow}>&#8594;</span>
                </div>
              </Show>

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

                <A href={`/tour/${tour().projectId}/${tour().id}`} class={styles.ExploreButton}>
                  Explore Tour <FiChevronRight />
                </A>

                <Show when={(tours()?.length || 0) > 1}>
                  <div class={styles.SwipeIndicator}>
                    <For each={tours()}>
                      {(_, index) => (
                        <span 
                          class={`${styles.Dot} ${index() === currentIndex() ? styles.DotActive : ""}`}
                          onClick={() => {
                            if (!isAnimating()) {
                              const direction = index() > currentIndex() ? "left" : "right";
                              const diff = Math.abs(index() - currentIndex());
                              if (diff === 1) {
                                animateSwipe(direction);
                              } else {
                                setCurrentIndex(index());
                              }
                            }
                          }}
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
