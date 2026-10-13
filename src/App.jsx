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

// These two values come from the .env file.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Shared Tailwind utility strings, so the markup below stays readable.
const SECTION = 'mx-auto w-full max-w-[1180px] px-6 py-[88px] max-[760px]:py-16'
const SECTION_HEAD = 'mb-8 max-w-[620px]'
const SECTION_TITLE = 'text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold'
const SECTION_SUB = 'mt-2.5 text-muted'

const BTN =
  'inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-6 py-3.5 text-[0.95rem] font-bold transition duration-150'
const BTN_PRIMARY = `${BTN} bg-accent text-accent-ink hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50`

const FILTER =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-[9px] text-[0.88rem] font-semibold transition duration-150'
const FILTER_OFF = `${FILTER} border-line bg-white/[0.04] text-muted hover:bg-white/[0.08] hover:text-ink`
const FILTER_ON = `${FILTER} border-transparent bg-accent text-accent-ink`

const CARD_FAV =
  'absolute top-2.5 left-2.5 z-[2] inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border bg-black/55 backdrop-blur-sm transition-colors duration-150 hover:bg-black/[0.78]'
const LIGHTBOX_FAV =
  'inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border bg-white/[0.08] transition-colors duration-150 hover:bg-white/[0.16]'
const FAV_ON = 'border-heart/[0.45] text-heart shadow-[0_0_16px_rgba(255,59,92,0.45)]'
const FAV_OFF = 'border-white/[0.18] text-white'

const LIGHTBOX_BTN =
  'absolute inline-flex items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur-[8px] transition-colors duration-150 hover:bg-white/[0.18]'

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
      <section id="gallery" className={SECTION}>
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>
            {showFavorites ? 'Your favorites' : 'The collection'}
          </h2>
          <p className={SECTION_SUB}>
            {showFavorites
              ? 'The photos you liked, kept together in one quiet corner.'
              : 'Every photo you have uploaded this session, arranged in one place.'}
          </p>
        </div>

        {/* The All / Favorites switch only appears once there is something to show */}
        {images.length > 0 && (
          <div className="mb-[22px] flex flex-wrap gap-2">
            <button
              type="button"
              className={showFavorites ? FILTER_OFF : FILTER_ON}
              onClick={() => setShowFavorites(false)}
            >
              All
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[0.72rem] font-bold ${
                  showFavorites ? 'bg-white/10' : 'bg-black/[0.16]'
                }`}
              >
                {images.length}
              </span>
            </button>
            <button
              type="button"
              className={showFavorites ? FILTER_ON : FILTER_OFF}
              onClick={() => setShowFavorites(true)}
            >
              Favorites
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[0.72rem] font-bold ${
                  showFavorites ? 'bg-black/[0.16]' : 'bg-white/10'
                }`}
              >
                {favorites.length}
              </span>
            </button>
          </div>
        )}

        {visibleImages.length === 0 ? (
          <div className="flex flex-col items-center gap-3.5 rounded-lg border border-dashed border-line bg-white/[0.04] px-6 py-16 text-center text-muted">
            <ImageIcon className="h-11 w-11 text-mint" />
            <p>
              {showFavorites
                ? 'No favorites yet. Tap the heart on a photo to keep it here.'
                : 'Your collection is waiting. Upload a photo to add the first frame.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {visibleImages.map((image, index) => {
              const isFavorite = favorites.includes(image.public_id)

              return (
                <figure
                  key={image.public_id}
                  className="group relative m-0 overflow-hidden rounded-md border border-line bg-panel transition duration-200 hover:-translate-y-1 hover:border-white/20"
                >
                  {/* Like / unlike this photo */}
                  <button
                    type="button"
                    className={`${CARD_FAV} ${isFavorite ? FAV_ON : FAV_OFF}`}
                    onClick={() => handleToggleFavorite(image.public_id)}
                    title={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    aria-label={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    aria-pressed={isFavorite}
                  >
                    <HeartIcon
                      filled={isFavorite}
                      className={`h-[15px] w-[15px] ${
                        isFavorite ? 'animate-heart-pop motion-reduce:animate-none' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    className="absolute top-2.5 right-2.5 z-[2] inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/[0.18] bg-black/55 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-danger"
                    onClick={() => handleRemove(image.public_id)}
                    title="Remove from gallery"
                    aria-label="Remove from gallery"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    className="block w-full cursor-pointer border-0 bg-transparent p-0"
                    onClick={() => setLightboxIndex(index)}
                    title="View this photo"
                    aria-label="View this photo full-screen"
                  >
                    <img
                      className="h-[220px] w-full object-cover transition-transform duration-[400ms] group-hover:scale-105"
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
      <section id="upload" className={SECTION}>
        <div className={SECTION_HEAD}>
          <h2 className={SECTION_TITLE}>Add to the collection</h2>
          <p className={SECTION_SUB}>
            Choose an image and send it to Cloudinary. It joins your gallery as
            soon as it uploads.
          </p>
        </div>

        <div className="flex max-w-[640px] flex-col items-start gap-4 rounded-lg border border-line bg-white/[0.04] p-7">
          {/* The label is the clickable drop area. The real <input> is hidden
              but still opened when the label is clicked. */}
          <label
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-line bg-white/[0.02] px-6 py-10 text-center text-muted transition duration-150 hover:border-orange hover:bg-orange/[0.06]"
            htmlFor="file-input"
          >
            <ImageIcon className="h-[34px] w-[34px] text-mint" />
            <span className="font-semibold text-ink">
              {file
                ? 'Choose a different image'
                : 'Choose an image from your device'}
            </span>
            <span className="text-[0.82rem]">JPG, PNG or WEBP</span>
            <input
              id="file-input"
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>

          {file && (
            <div className="flex w-full animate-fade-in items-center gap-3.5 rounded-md border border-line bg-white/[0.03] p-3">
              <img
                className="h-[84px] w-[84px] rounded-sm border border-line bg-panel object-cover"
                src={previewUrl}
                alt="Preview of the selected image"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-all text-ink">{file.name}</p>
                <p className="mt-0.5 text-[0.82rem] text-muted">
                  {formatSize(file.size)} · preview — not uploaded yet
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-white/[0.16] bg-black/50 text-white transition-colors duration-150 hover:bg-danger disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleClearSelection}
                disabled={isUploading}
                title="Remove this image"
                aria-label="Remove this image"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            className={`${BTN_PRIMARY} w-full`}
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading…' : 'Upload image'}
          </button>

          {isUploading && (
            <p className="text-[0.9rem] text-orange">
              Uploading your image, please wait…
            </p>
          )}

          {error && (
            <p
              className="w-full rounded-sm border border-red-500/35 bg-red-500/[0.12] px-4 py-3 text-[0.9rem] text-[#ffd9d9]"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ---------------- Full-screen viewer ---------------- */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center bg-[rgba(4,8,6,0.9)] p-6 backdrop-blur-[10px] max-[760px]:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className={`${LIGHTBOX_BTN} top-5 right-5 z-[3] h-11 w-11 max-[760px]:top-3 max-[760px]:right-3`}
            onClick={() => setLightboxIndex(null)}
            aria-label="Close viewer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          {visibleImages.length > 1 && (
            <button
              type="button"
              className={`${LIGHTBOX_BTN} top-1/2 left-5 z-[2] h-[46px] w-[46px] -translate-y-1/2 max-[760px]:left-2 max-[760px]:h-10 max-[760px]:w-10`}
              onClick={(event) => {
                event.stopPropagation()
                showPrevImage()
              }}
              aria-label="Previous photo"
            >
              <ChevronLeftIcon className="h-[22px] w-[22px]" />
            </button>
          )}

          <figure
            className="m-0 flex max-w-[min(1100px,92vw)] flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              className="max-h-[76vh] max-w-full animate-fade-in rounded-md object-contain shadow-glow max-[760px]:max-h-[70vh]"
              src={getLargeUrl(lightboxImage.secure_url)}
              alt="Enlarged view of the photo"
            />

            <figcaption className="flex items-center gap-[14px] text-[0.85rem] text-muted">
              <button
                type="button"
                className={`${LIGHTBOX_FAV} ${lightboxIsFavorite ? FAV_ON : 'border-white/[0.16] text-white'}`}
                onClick={() => handleToggleFavorite(lightboxImage.public_id)}
                aria-pressed={lightboxIsFavorite}
                aria-label={
                  lightboxIsFavorite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <HeartIcon
                  filled={lightboxIsFavorite}
                  className={`h-[17px] w-[17px] ${
                    lightboxIsFavorite
                      ? 'animate-heart-pop motion-reduce:animate-none'
                      : ''
                  }`}
                />
              </button>

              <span className="font-semibold text-ink">
                {lightboxIndex + 1} / {visibleImages.length}
              </span>

              <a
                className="ml-auto font-semibold text-mint hover:underline"
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
              className={`${LIGHTBOX_BTN} top-1/2 right-5 z-[2] h-[46px] w-[46px] -translate-y-1/2 max-[760px]:right-2 max-[760px]:h-10 max-[760px]:w-10`}
              onClick={(event) => {
                event.stopPropagation()
                showNextImage()
              }}
              aria-label="Next photo"
            >
              <ChevronRightIcon className="h-[22px] w-[22px]" />
            </button>
          )}
        </div>
      )}

      <footer className="border-t border-line pt-10 pb-[60px] text-center text-[0.85rem] text-muted">
        <p>
          <strong className="text-ink">
            VISTA<span className="text-orange">.</span>
          </strong>{' '}
          — the wild, kept close.
        </p>
      </footer>
    </>
  )
}

export default App
