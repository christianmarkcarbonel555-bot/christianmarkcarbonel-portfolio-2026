document.addEventListener('DOMContentLoaded', () => {
  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const carousel = document.querySelector('.certificate-list');
  const track = carousel?.querySelector('.certificate-track');
  if (!carousel || !track) {
    return;
  }

  const slides = Array.from(track.querySelectorAll('.certificate-item:not(.certificate-duplicate)'));
  const slideCount = slides.length;
  const trackSlideCount = track.querySelectorAll('.certificate-item').length;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0;
  let pointerStartX = null;
  let suppressClick = false;
  let isHovered = false;
  let isFocused = false;
  let autoplayTimer = null;

  function scheduleAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = window.setTimeout(() => {
      if (!isHovered && !isFocused && !document.hidden) {
        advance();
      }
      scheduleAutoplay();
    }, 3000);
  }

  function setPosition(nextPosition) {
    position = nextPosition;
    track.style.transform = `translateX(-${(position * 100) / trackSlideCount}%)`;
  }

  function moveTo(nextPosition) {
    if (motionPreference.matches) {
      setPosition(nextPosition >= slideCount ? 0 : nextPosition);
      return;
    }
    setPosition(nextPosition);
  }

  function advance() {
    moveTo(position >= slideCount - 1 ? slideCount : position + 1);
  }

  function goToPrevious() {
    if (position === 0 && !motionPreference.matches) {
      track.style.transition = 'none';
      setPosition(slideCount);
      track.getBoundingClientRect();
      track.style.removeProperty('transition');
      moveTo(slideCount - 1);
      return;
    }
    moveTo(position <= 0 ? slideCount - 1 : position - 1);
  }

  carousel.addEventListener('click', (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }

    const control = event.target.closest('.carousel-controls a');
    if (!control) {
      return;
    }

    event.preventDefault();
    const targetId = control.getAttribute('href')?.slice(1);
    const targetSlide = slides.findIndex((slide) => slide.id === targetId);
    if (targetSlide < 0) {
      return;
    }

    if (position === slideCount - 1 && targetSlide === 0) {
      moveTo(slideCount);
    } else if (position === 0 && targetSlide === slideCount - 1) {
      goToPrevious();
    } else {
      moveTo(targetSlide);
    }
    scheduleAutoplay();
  });

  track.addEventListener('transitionend', (event) => {
    if (event.target !== track || event.propertyName !== 'transform' || position !== slideCount) {
      return;
    }

    track.style.transition = 'none';
    setPosition(0);
    track.getBoundingClientRect();
    track.style.removeProperty('transition');
  });

  carousel.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
  });

  carousel.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) {
      return;
    }

    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 50) {
      return;
    }

    suppressClick = true;
    if (distance < 0) {
      advance();
    } else {
      goToPrevious();
    }
    scheduleAutoplay();
    window.setTimeout(() => {
      suppressClick = false;
    }, 500);
  });

  carousel.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });
  carousel.addEventListener('pointerenter', () => {
    isHovered = true;
    window.clearTimeout(autoplayTimer);
  });
  carousel.addEventListener('pointerleave', () => {
    isHovered = false;
    scheduleAutoplay();
  });
  carousel.addEventListener('focusin', () => {
    isFocused = true;
    window.clearTimeout(autoplayTimer);
  });
  carousel.addEventListener('focusout', (event) => {
    isFocused = carousel.contains(event.relatedTarget);
    if (!isFocused) {
      scheduleAutoplay();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(autoplayTimer);
    } else {
      scheduleAutoplay();
    }
  });

  scheduleAutoplay();
});
