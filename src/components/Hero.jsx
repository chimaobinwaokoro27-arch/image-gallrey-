import { useEffect, useState } from 'react'

// A rotating set of free-to-use photos (Unsplash License). It is a deliberately
// mixed set — city, architecture, people, food, abstract, tech and travel, with
// just one landscape — so the backdrop never feels like it is all nature.
// They are used only as a decorative background — never as gallery items.
const HERO_IMAGES = [
  // city buildings
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=75',
  // Brooklyn Bridge at night
  'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?auto=format&fit=crop&w=1920&q=75',
  // modern architecture
  'https://images.unsplash.com/photo-1527576539890-dfa815648363?auto=format&fit=crop&w=1920&q=75',
  // portrait
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1920&q=75',
  // portrait
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1920&q=75',
  // food
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1920&q=75',
  // abstract texture
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1920&q=75',
  // workspace / technology
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=75',
  // travel / street
  'https://images.unsplash.com/photo-1549654911-76c991fab90a?auto=format&fit=crop&w=1920&q=75',
  // landscape
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=75',
]

// Shared button styles (Tailwind utilities), reused by both hero buttons.
const BTN =
  'inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-[0.95rem] font-bold transition duration-150'
const BTN_PRIMARY = `${BTN} border-transparent bg-accent text-accent-ink hover:-translate-y-px hover:bg-accent-hover`
const BTN_GHOST = `${BTN} border-line bg-white/[0.06] text-ink backdrop-blur-sm hover:bg-white/[0.12]`

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
    <header
      id="home"
      className="relative flex min-h-[92vh] items-end overflow-hidden bg-[#060a08] pt-[180px] pb-24 max-md:min-h-[88vh] max-md:pt-40 max-md:pb-16"
    >
      {/* One layer per photo; only the active one is visible. CSS crossfades
          between them, so the change is a smooth fade instead of a hard cut. */}
      <div className="absolute inset-0 z-[1]">
        {HERO_IMAGES.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ${
              index === active ? 'animate-hero-zoom opacity-100' : 'scale-105 opacity-0'
            }`}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(6,10,8,0.5)_0%,rgba(6,10,8,0.72)_55%,#0a0f0d_100%)]" />

      <div className="relative z-[3] mx-auto w-full max-w-[1180px] px-6">
        <p className="mb-[18px] text-[0.78rem] font-semibold tracking-[0.22em] text-mint uppercase">
          Your photos · Your wild · Your journal
        </p>

        <h1 className="max-w-[14ch] text-[clamp(2.75rem,9vw,6rem)] leading-[0.98] font-extrabold tracking-[-0.03em]">
          The wild, kept <span className="text-mint">close.</span>
        </h1>

        <p className="mt-[22px] max-w-[46ch] text-[clamp(1rem,1.6vw,1.15rem)] text-muted">
          Upload the landscapes and moments you love. VISTA turns them into a
          living gallery — a quiet record of everywhere you have been.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a className={BTN_PRIMARY} href="#upload">
            Start your journal
          </a>
          <a className={BTN_GHOST} href="#gallery">
            View the collection
          </a>
        </div>
      </div>
    </header>
  )
}

export default Hero
