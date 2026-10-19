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
  const leadingClone = slides[slideCount - 1].cloneNode(true);
  leadingClone.removeAttribute('id');
  leadingClone.classList.add('certificate-duplicate');
  leadingClone.setAttribute('aria-hidden', 'true');
  leadingClone.querySelector('.carousel-controls')?.remove();
  const cloneLink = leadingClone.querySelector('a');
  if (cloneLink) {
    cloneLink.removeAttribute('href');
    cloneLink.removeAttribute('target');
    cloneLink.removeAttribute('rel');
    cloneLink.tabIndex = -1;
  }
  track.prepend(leadingClone);

  const trackSlides = Array.from(track.querySelectorAll('.certificate-item'));
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = 1;
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
    trackSlides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === position);
      slide.classList.toggle('is-adjacent', Math.abs(index - position) === 1);
    });
    const activeSlide = trackSlides[position];
    const offset = carousel.clientWidth / 2 - (activeSlide.offsetLeft + activeSlide.offsetWidth / 2);
    track.style.transform = `translateX(${offset}px)`;
  }

  function moveTo(nextPosition) {
    if (motionPreference.matches) {
      if (nextPosition <= 0) {
        setPosition(slideCount);
      } else if (nextPosition >= slideCount + 1) {
        setPosition(1);
      } else {
        setPosition(nextPosition);
      }
      return;
    }
    setPosition(nextPosition);
  }

  function advance() {
    moveTo(position + 1);
  }

  function goToPrevious() {
    moveTo(position - 1);
  }

  setPosition(position);

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

    if (position === slideCount && targetSlide === 0) {
      moveTo(slideCount + 1);
    } else if (position === 1 && targetSlide === slideCount - 1) {
      moveTo(0);
    } else {
      moveTo(targetSlide + 1);
    }
    scheduleAutoplay();
  });

  track.addEventListener('transitionend', (event) => {
    if (
      event.target !== track ||
      event.propertyName !== 'transform' ||
      (position !== 0 && position !== slideCount + 1)
    ) {
      return;
    }

    track.style.transition = 'none';
    trackSlides.forEach((slide) => {
      slide.style.transition = 'none';
    });
    setPosition(position === 0 ? slideCount : 1);
    track.getBoundingClientRect();
    track.style.removeProperty('transition');
    trackSlides.forEach((slide) => {
      slide.style.removeProperty('transition');
    });
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
  window.addEventListener('resize', () => {
    setPosition(position);
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
