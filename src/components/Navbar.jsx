import { PlusIcon, MarkIcon } from './Icons'

// The floating, pill-shaped navigation bar.
// Every link is a plain "#id" anchor, so they smoothly scroll to a section
// on this same page (see `scroll-behavior: smooth` in index.css).
function Navbar({ favoritesCount, onShowFavorites }) {
  return (
    <nav className="nav">
      <div className="nav__inner">
        {/* Brand: a small mark plus "VISTA." (the dot is in the accent color) */}
        <a className="nav__brand" href="#home">
          <span className="nav__mark">
            <MarkIcon />
          </span>
          <span className="nav__logo">
            VISTA<span className="nav__logo-dot">.</span>
          </span>
        </a>

        <ul className="nav__links">
          <li>
            <a href="#home" onClick={() => onShowFavorites(false)}>
              Home
            </a>
          </li>
          <li>
            <a href="#gallery" onClick={() => onShowFavorites(false)}>
              Gallery
            </a>
          </li>
          <li>
            <a href="#upload">Upload</a>
          </li>
          <li>
            {/* Opens the gallery filtered down to the liked photos */}
            <a href="#gallery" onClick={() => onShowFavorites(true)}>
              Favorites
              <span className="nav__badge">{favoritesCount}</span>
            </a>
          </li>
        </ul>

        <a className="nav__cta" href="#upload">
          <PlusIcon />
          Add image
        </a>
      </div>
    </nav>
  )
}

export default Navbar
