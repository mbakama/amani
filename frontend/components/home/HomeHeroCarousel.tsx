'use client';

import { useEffect, useState } from 'react';

const SLIDES = [
  {
    src: '/hero/amani-image.png',
    alt: 'Microphone et ambiance musicale',
    position: 'object-[center_35%] md:object-center',
  },
  {
    src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=2000&q=80',
    alt: 'Concert en direct',
    position: 'object-[center_40%] md:object-center',
  },
  {
    src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=2000&q=80',
    alt: 'Studio et instruments',
    position: 'object-[70%_center] md:object-center',
  },
  {
    src: '/hero/jeune-chanteuse.png',
    alt: 'Jeune femme aux écouteurs en train de chanter',
    position: 'object-[center_25%] md:object-[center_30%]',
  },
];

const INTERVAL_MS = 6500;

export default function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-roledescription="carousel">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`home-carousel-slide absolute inset-0 ${i === index ? 'is-active' : ''}`}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={i === index ? `active-${slide.src}` : slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`h-full w-full object-cover ${slide.position} ${i === index ? 'home-kenburns' : ''}`}
          />
        </div>
      ))}
      <div className="home-hero-scrim absolute inset-0 z-[2]" />

      <div
        className="home-carousel-dots absolute right-4 z-10 flex gap-2 md:right-8"
        role="tablist"
        aria-label="Images du hero"
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-label={`Image ${i + 1} : ${slide.alt}`}
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={`home-carousel-dot ${i === index ? 'is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
