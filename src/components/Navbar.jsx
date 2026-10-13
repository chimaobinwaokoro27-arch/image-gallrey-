import { PlusIcon, MarkIcon } from './Icons'

// Shared look for the four navigation links.
const LINK =
  "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.9rem] font-medium text-muted transition-colors duration-150 hover:bg-white/[0.06] hover:text-ink after:absolute after:bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-linear-to-r after:from-accent after:to-mint after:transition-all after:duration-200 after:content-[''] hover:after:w-[46%] max-md:px-2.5 max-md:py-2 max-md:text-[0.85rem]"

// The floating, pill-shaped navigation bar.
// Every link is a plain "#id" anchor, so they smoothly scroll to a section
// on this same page (see `scroll-behavior: smooth` in index.css).
function Navbar({ favoritesCount, onShowFavorites }) {
  return (
    <nav className="fixed top-[18px] right-0 left-0 z-[100] flex justify-center px-4 max-md:top-3">
      <div className="group relative flex w-full max-w-[1180px] items-center justify-between gap-5 rounded-full border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0)_45%),rgba(12,18,15,0.78)] py-2.5 pr-3 pl-[22px] shadow-[0_18px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px] backdrop-saturate-[140%] transition-[border-color,box-shadow] duration-300 hover:border-accent/[0.28] hover:shadow-[0_22px_60px_rgba(0,0,0,0.55),0_0_42px_rgba(127,227,176,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] max-md:flex-wrap max-md:gap-2.5 max-md:rounded-3xl max-md:px-3.5 max-md:py-2.5">
        {/* Masked gradient ring around the whole pill */}
        <span
          aria-hidden="true"
          className="nav-ring opacity-[0.45] transition-opacity duration-300 group-hover:opacity-[0.95]"
        />

        {/* Brand: a small mark plus "VISTA." (the dot is in the accent color) */}
        <a className="group/brand inline-flex items-center gap-2.5" href="#home">
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-linear-to-br from-accent to-[#4fc98c] text-accent-ink shadow-[0_6px_18px_rgba(127,227,176,0.32),inset_0_1px_0_rgba(255,255,255,0.5)] transition-transform duration-300 group-hover/brand:-rotate-[8deg] group-hover/brand:scale-[1.06]">
            <MarkIcon className="h-5 w-5" />
          </span>
          <span className="text-[1.35rem] font-extrabold tracking-[-0.02em]">
            VISTA<span className="text-orange">.</span>
          </span>
        </a>

        <ul className="flex list-none gap-1.5 p-0 max-md:order-3 max-md:w-full max-md:justify-between max-md:gap-0.5">
          <li>
            <a className={LINK} href="#home" onClick={() => onShowFavorites(false)}>
              Home
            </a>
          </li>
          <li>
            <a
              className={LINK}
              href="#gallery"
              onClick={() => onShowFavorites(false)}
            >
              Gallery
            </a>
          </li>
          <li>
            <a className={LINK} href="#upload">
              Upload
            </a>
          </li>
          <li>
            {/* Opens the gallery filtered down to the liked photos */}
            <a className={LINK} href="#gallery" onClick={() => onShowFavorites(true)}>
              Favorites
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-heart px-1.5 text-[0.72rem] font-bold text-white shadow-[0_0_0_1px_rgba(255,59,92,0.4),0_4px_14px_rgba(255,59,92,0.4)]">
                {favoritesCount}
              </span>
            </a>
          </li>
        </ul>

        <a
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-br from-accent to-[#5fd39a] px-[18px] py-2.5 text-[0.9rem] font-bold whitespace-nowrap text-accent-ink shadow-[0_8px_22px_rgba(127,227,176,0.32)] transition duration-150 before:absolute before:top-0 before:-left-[70%] before:h-full before:w-[45%] before:skew-x-[-20deg] before:bg-linear-to-r before:from-transparent before:via-white/55 before:to-transparent before:transition-all before:duration-500 before:content-[''] hover:-translate-y-px hover:from-accent-hover hover:to-[#6fdfa8] hover:shadow-[0_12px_30px_rgba(127,227,176,0.5)] hover:before:left-[130%]"
          href="#upload"
        >
          <PlusIcon className="h-4 w-4" />
          Add image
        </a>
      </div>
    </nav>
  )
}

export default Navbar
