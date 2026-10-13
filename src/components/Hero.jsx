import { useEffect, useState } from 'react'

// A rotating set of free-to-use landscape photos (Unsplash License).
// They are used only as a decorative background — never as gallery items.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
]

function Hero() {
  // Which background photo is currently showing
  const [active, setActive] = useState(0)

  // useEffect starts a timer when the page loads. Every 6 seconds it moves
  // "active" to the next photo, so the background is always changing.
  // The function we return clears the timer if the component is removed.
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % HERO_IMAGES.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [])

  return (
    <header className="hero" id="home">
      {/* One layer per photo; only the active one is visible. CSS crossfades
          between them, so the change is a smooth fade instead of a hard cut. */}
      <div className="hero__bg">
        {HERO_IMAGES.map((src, index) => (
          <div
            key={src}
            className={
              index === active ? 'hero__layer hero__layer--active' : 'hero__layer'
            }
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
      </div>

      <div className="hero__overlay" />

      <div className="hero__content container">
        <p className="hero__tagline">
          Your photos · Your wild · Your journal
        </p>

        <h1 className="hero__title">
          The wild, kept <span className="hero__accent">close.</span>
        </h1>

        <p className="hero__subtitle">
          Upload the landscapes and moments you love. VISTA turns them into a
          living gallery — a quiet record of everywhere you have been.
        </p>

        <div className="hero__actions">
          <a className="btn btn--primary" href="#upload">
            Start your journal
          </a>
          <a className="btn btn--ghost" href="#gallery">
            View the collection
          </a>
        </div>
      </div>
    </header>
  )
}

export default Hero
