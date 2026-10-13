import { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HeartIcon,
  ImageIcon,
} from './components/Icons'
import './App.css'

// These two values come from the .env file.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Build a small thumbnail URL from the original Cloudinary URL by inserting
// a transformation right after "/image/upload/":
//   w_600,h_450,c_fill  -> resize + crop to a tidy card shape
//   q_auto,f_auto       -> best quality, modern format (WebP/AVIF)
// The original URL is never changed, and the image is only uploaded once.
function getThumbnailUrl(url) {
  return url.replace(
    '/image/upload/',
    '/image/upload/w_600,h_450,c_fill,q_auto,f_auto/'
  )
}

// A larger version for the full-screen viewer. c_limit keeps the photo's
// own shape instead of cropping it, and caps the width at 1400px.
function getLargeUrl(url) {
  return url.replace(
    '/image/upload/',
    '/image/upload/w_1400,c_limit,q_auto,f_auto/'
  )
}

// Turn a number of bytes into something friendly like "1.4 MB"
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function App() {
  // The image file the user picked (null = nothing picked yet)
  const [file, setFile] = useState(null)

  // A temporary local URL used to preview the picked file before uploading
  const [previewUrl, setPreviewUrl] = useState('')

  // Lets us reset the hidden <input> so the same file can be picked again
  const fileInputRef = useRef(null)

  // Every successfully uploaded image for this session
  const [images, setImages] = useState([])

  // True while an upload is in progress
  const [isUploading, setIsUploading] = useState(false)

  // A message shown when something goes wrong ("" = no error)
  const [error, setError] = useState('')

  // public_id values of the images the user liked (session only)
  const [favorites, setFavorites] = useState([])

  // When true, the gallery shows only the liked images
  const [showFavorites, setShowFavorites] = useState(false)

  // Index of the photo open in the full-screen viewer (null = closed)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Remove one image from the session gallery (not from Cloudinary).
  // It also stops being a favorite, so the counts stay correct.
  function handleRemove(publicId) {
    setImages((prev) => prev.filter((image) => image.public_id !== publicId))
    setFavorites((prev) => prev.filter((id) => id !== publicId))
  }

  // Like / unlike a photo: add its id, or take it out again
  function handleToggleFavorite(publicId) {
    setFavorites((prev) =>
      prev.includes(publicId)
        ? prev.filter((id) => id !== publicId)
        : [...prev, publicId]
    )
  }

  // Runs every time the user picks a file — and builds a preview URL for it
  function handleFileChange(event) {
    const nextFile = event.target.files[0] || null
    setFile(nextFile)
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : '')
    setError('')
  }

  // Clear the chosen file (and its preview) before uploading
  function handleClearSelection() {
    setFile(null)
    setPreviewUrl('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Free the preview URL's memory when it changes or the app unmounts
  useEffect(() => {
    if (!previewUrl) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  // Runs when the "Upload image" button is clicked
  async function handleUpload() {
    if (!file) return

    // Make sure the .env values are filled in
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        'Cloudinary is not configured yet. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file, then restart the dev server.'
      )
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // 1. FormData is what the Cloudinary Upload API expects
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)

      // 2. Send it to the unsigned upload endpoint
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )

      const data = await response.json()

      // 3. If Cloudinary reported an error, throw it
      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed. Please try again.')
      }

      // 4. Add the new image to the top of the gallery
      setImages((prev) => [data, ...prev])

      // 5. Clear the picked file, its preview, and the hidden input
      setFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message || 'Something went wrong during the upload.')
    } finally {
      setIsUploading(false)
    }
  }

  // The list actually shown in the gallery (all images, or only favorites)
  const visibleImages = showFavorites
    ? images.filter((image) => favorites.includes(image.public_id))
    : images

  // ----- Full-screen viewer (lightbox) -----

  // Step to the previous / next photo, wrapping around at the ends
  function showPrevImage() {
    setLightboxIndex(
      (i) => (i - 1 + visibleImages.length) % visibleImages.length
    )
  }

  function showNextImage() {
    setLightboxIndex((i) => (i + 1) % visibleImages.length)
  }

  // The viewer is only truly open when the index still points at a real photo.
  // (Deriving this instead of storing it keeps the state in one place.)
  const isLightboxOpen =
    lightboxIndex !== null && lightboxIndex < visibleImages.length

  const lightboxImage = isLightboxOpen ? visibleImages[lightboxIndex] : null

  const lightboxIsFavorite = lightboxImage
    ? favorites.includes(lightboxImage.public_id)
    : false

  // While the viewer is open: react to the keyboard and stop page scrolling
  useEffect(() => {
    if (!isLightboxOpen) return

    const count = visibleImages.length

    function handleKey(event) {
      if (event.key === 'Escape') setLightboxIndex(null)
      else if (event.key === 'ArrowLeft')
        setLightboxIndex((i) => (i - 1 + count) % count)
      else if (event.key === 'ArrowRight')
        setLightboxIndex((i) => (i + 1) % count)
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen, visibleImages.length])

  return (
    <>
      <Navbar
        favoritesCount={favorites.length}
        onShowFavorites={setShowFavorites}
      />

      <Hero />

      {/* ---------------- Gallery ---------------- */}
      <section id="gallery" className="section container">
        <div className="section__head">
          <h2 className="section__title">
            {showFavorites ? 'Your favorites' : 'The collection'}
          </h2>
          <p className="section__subtitle">
            {showFavorites
              ? 'The photos you liked, kept together in one quiet corner.'
              : 'Every photo you have uploaded this session, arranged in one place.'}
          </p>
        </div>

        {/* The All / Favorites switch only appears once there is something to show */}
        {images.length > 0 && (
          <div className="filters">
            <button
              type="button"
              className={showFavorites ? 'filter' : 'filter filter--active'}
              onClick={() => setShowFavorites(false)}
            >
              All
              <span className="filter__count">{images.length}</span>
            </button>
            <button
              type="button"
              className={showFavorites ? 'filter filter--active' : 'filter'}
              onClick={() => setShowFavorites(true)}
            >
              Favorites
              <span className="filter__count">{favorites.length}</span>
            </button>
          </div>
        )}

        {visibleImages.length === 0 ? (
          <div className="empty">
            <ImageIcon />
            <p>
              {showFavorites
                ? 'No favorites yet. Tap the heart on a photo to keep it here.'
                : 'Your collection is waiting. Upload a photo to add the first frame.'}
            </p>
          </div>
        ) : (
          <div className="gallery">
            {visibleImages.map((image, index) => {
              const isFavorite = favorites.includes(image.public_id)

              return (
                <figure key={image.public_id} className="card">
                  {/* Like / unlike this photo */}
                  <button
                    type="button"
                    className={
                      isFavorite ? 'card__fav card__fav--on' : 'card__fav'
                    }
                    onClick={() => handleToggleFavorite(image.public_id)}
                    title={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    aria-label={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    aria-pressed={isFavorite}
                  >
                    <HeartIcon filled={isFavorite} />
                  </button>

                  <button
                    type="button"
                    className="card__remove"
                    onClick={() => handleRemove(image.public_id)}
                    title="Remove from gallery"
                    aria-label="Remove from gallery"
                  >
                    <CloseIcon />
                  </button>

                  <button
                    type="button"
                    className="card__link"
                    onClick={() => setLightboxIndex(index)}
                    title="View this photo"
                    aria-label="View this photo full-screen"
                  >
                    <img
                      className="card__img"
                      src={getThumbnailUrl(image.secure_url)}
                      alt="Uploaded frame"
                      loading="lazy"
                    />
                  </button>
                </figure>
              )
            })}
          </div>
        )}
      </section>

      {/* ---------------- Upload ---------------- */}
      <section id="upload" className="section container">
        <div className="section__head">
          <h2 className="section__title">Add to the collection</h2>
          <p className="section__subtitle">
            Choose an image and send it to Cloudinary. It joins your gallery as
            soon as it uploads.
          </p>
        </div>

        <div className="upload">
          {/* The label is the clickable drop area. The real <input> is hidden
              but still opened when the label is clicked. */}
          <label className="upload__drop" htmlFor="file-input">
            <ImageIcon />
            <span className="upload__drop-title">
              {file
                ? 'Choose a different image'
                : 'Choose an image from your device'}
            </span>
            <span className="upload__drop-hint">JPG, PNG or WEBP</span>
            <input
              id="file-input"
              ref={fileInputRef}
              className="upload__input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>

          {file && (
            <div className="preview">
              <img
                className="preview__img"
                src={previewUrl}
                alt="Preview of the selected image"
              />
              <div className="preview__meta">
                <p className="preview__name">{file.name}</p>
                <p className="preview__size">
                  {formatSize(file.size)} · preview — not uploaded yet
                </p>
              </div>
              <button
                type="button"
                className="preview__clear"
                onClick={handleClearSelection}
                disabled={isUploading}
                title="Remove this image"
                aria-label="Remove this image"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary upload__btn"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading…' : 'Upload image'}
          </button>

          {isUploading && (
            <p className="upload__status">Uploading your image, please wait…</p>
          )}

          {error && (
            <p className="upload__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ---------------- Full-screen viewer ---------------- */}
      {lightboxImage && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close viewer"
          >
            <CloseIcon />
          </button>

          {visibleImages.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              onClick={(event) => {
                event.stopPropagation()
                showPrevImage()
              }}
              aria-label="Previous photo"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <figure
            className="lightbox__figure"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="lightbox__img"
              src={getLargeUrl(lightboxImage.secure_url)}
              alt="Enlarged view of the photo"
            />

            <figcaption className="lightbox__caption">
              <button
                type="button"
                className={
                  lightboxIsFavorite
                    ? 'lightbox__fav lightbox__fav--on'
                    : 'lightbox__fav'
                }
                onClick={() => handleToggleFavorite(lightboxImage.public_id)}
                aria-pressed={lightboxIsFavorite}
                aria-label={
                  lightboxIsFavorite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <HeartIcon filled={lightboxIsFavorite} />
              </button>

              <span className="lightbox__count">
                {lightboxIndex + 1} / {visibleImages.length}
              </span>

              <a
                className="lightbox__original"
                href={lightboxImage.secure_url}
                target="_blank"
                rel="noreferrer"
              >
                Open original
              </a>
            </figcaption>
          </figure>

          {visibleImages.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              onClick={(event) => {
                event.stopPropagation()
                showNextImage()
              }}
              aria-label="Next photo"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      )}

      <footer className="footer">
        <p>
          <strong>
            VISTA<span className="footer__dot">.</span>
          </strong>{' '}
          — the wild, kept close.
        </p>
      </footer>
    </>
  )
}

export default App
