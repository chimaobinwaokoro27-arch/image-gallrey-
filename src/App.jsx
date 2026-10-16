import { useCallback, useEffect, useRef, useState } from 'react'
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

// Where the gallery, the favorites and the hidden list are remembered between
// visits (on this device).
const STORAGE_KEY = 'vista.gallery.v1'
const FAVORITES_KEY = 'vista.favorites.v1'
const HIDDEN_KEY = 'vista.hidden.v1'

// Shared Tailwind utility strings, so the markup below stays readable.
const SECTION = 'mx-auto w-full max-w-[1180px] px-6 py-[88px] max-[760px]:py-16'
const SECTION_HEAD = 'mb-8 max-w-[620px]'
const SECTION_TITLE = 'text-[clamp(1.7rem,3.5vw,2.4rem)] font-extrabold'
const SECTION_SUB = 'mt-2.5 text-muted'

const BTN =
  'inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-6 py-3.5 text-[0.95rem] font-bold transition duration-150'
const BTN_PRIMARY = `${BTN} bg-accent text-accent-ink hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50`
const BTN_GHOST =
  'inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[0.85rem] font-semibold text-muted transition duration-150 hover:bg-white/[0.08] hover:text-ink disabled:cursor-not-allowed disabled:opacity-55'

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

// Read a list from localStorage, returning [] when it is missing or unreadable.
// (JSON.parse(null) is null, which is not an array, so that is covered too.)
function loadList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Keep only the fields the gallery actually needs, so the saved data stays
// small and we never store anything we do not display.
function slimImage(data) {
  return {
    public_id: data.public_id,
    secure_url: data.secure_url,
    width: data.width,
    height: data.height,
    created_at: data.created_at,
  }
}

// Turn whatever the upload threw into a message that names the real reason.
// A bare "Failed to fetch" means the browser never got a reply from
// api.cloudinary.com, which is a network / browser-block problem rather than
// anything wrong with the photo, so we say so instead of echoing the cryptic
// browser text.
function describeUploadError(err) {
  if (err && err.name === 'AbortError') {
    return 'The upload timed out before Cloudinary replied. Your connection looks slow or unstable for this file — try again (ideally on Wi-Fi) or pick a smaller image.'
  }

  if (err instanceof TypeError) {
    return 'Could not reach Cloudinary (api.cloudinary.com): the request was blocked or never left your browser. Common causes are an ad-blocker / privacy extension, strict tracking protection, a VPN or firewall, or being offline. Allow this site in the blocker (or try another network) and click Upload image again.'
  }

  return err?.message || 'Something went wrong during the upload.'
}

// Ask our own serverless function for the whole collection. That function
// talks to the Cloudinary Admin API, so this is what lets photos uploaded on
// one device show up on another. Returns { images } on success, { error } when
// the server reported a problem, or {} when there is simply nothing to call
// (for example during `vite dev`).
async function fetchServerImages() {
  let response
  try {
    response = await fetch('/api/photos', {
      headers: { Accept: 'application/json' },
      // Ask the browser not to reuse a cached copy, so "Refresh" is a real
      // refresh and deleted photos are noticed quickly.
      cache: 'no-store',
    })
  } catch {
    return {
      error:
        'Could not reach the gallery service. Check your connection and try Refresh.',
    }
  }

  const type = response.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    // No serverless function to call (for example during `vite dev`). Keep the
    // local gallery and stay quiet instead of showing a scary error.
    return {}
  }

  try {
    const data = await response.json()
    if (!response.ok) {
      return { error: data.error || 'Could not load your cloud gallery.' }
    }
    return { images: Array.isArray(data.images) ? data.images : [] }
  } catch {
    return { error: 'The gallery service returned an unexpected response.' }
  }
}

// Combine lists of images, dropping duplicates (same public_id) and putting the
// newest first. Later lists win when the same photo appears twice.
function mergeImages(...lists) {
  const byId = new Map()
  for (const list of lists) {
    for (const image of list) {
      if (image && typeof image.public_id === 'string' && image.secure_url) {
        byId.set(image.public_id, image)
      }
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  )
}

function App() {
  // The image file the user picked (null = nothing picked yet)
  const [file, setFile] = useState(null)

  // A temporary local URL used to preview the picked file before uploading
  const [previewUrl, setPreviewUrl] = useState('')

  // Lets us reset the hidden <input> so the same file can be picked again
  const fileInputRef = useRef(null)

  // Images uploaded during this visit that the server list may not have caught
  // up with yet, so a brand-new upload never blinks out of the gallery.
  const pendingUploadsRef = useRef(new Map())

  // Every successfully uploaded image, restored from the last visit
  const [images, setImages] = useState(() =>
    loadList(STORAGE_KEY).filter(
      (image) =>
        image &&
        typeof image.public_id === 'string' &&
        typeof image.secure_url === 'string'
    )
  )

  // True while an upload is in progress
  const [isUploading, setIsUploading] = useState(false)

  // A message shown when something goes wrong ("" = no error)
  const [error, setError] = useState('')

  // public_id values of the images the user liked, restored from the last visit
  const [favorites, setFavorites] = useState(() =>
    loadList(FAVORITES_KEY).filter((id) => typeof id === 'string')
  )

  // public_id values the user removed on this device. The photo stays safe in
  // Cloudinary, it just stops being shown here.
  const [hidden, setHidden] = useState(() =>
    loadList(HIDDEN_KEY).filter((id) => typeof id === 'string')
  )

  // A short message shown if the shared (server) gallery cannot be reached.
  const [syncNote, setSyncNote] = useState('')

  // True while we are re-reading the shared gallery from the server.
  const [isSyncing, setIsSyncing] = useState(false)

  // Bumped when the visitor asks for a fresh list; the sync effect watches it.
  const [syncToken, setSyncToken] = useState(0)

  // When true, the gallery shows only the liked images
  const [showFavorites, setShowFavorites] = useState(false)

  // Index of the photo open in the full-screen viewer (null = closed)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Hide an image from this device (it is not deleted from Cloudinary).
  // It also stops being a favorite, so the counts stay correct.
  function handleRemove(publicId) {
    setHidden((prev) => (prev.includes(publicId) ? prev : [...prev, publicId]))
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

  // Save the gallery to localStorage whenever it changes, so uploaded images
  // are still here when the visitor comes back later.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
    } catch {
      // Storage can be unavailable (private mode) or full — ignore and move on.
    }
  }, [images])

  // Save the favorites too, so the hearts are still filled on the next visit.
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {
      // Ignore storage errors — persistence is best-effort.
    }
  }, [favorites])

  // Save the hidden list so removed photos stay removed on this device.
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden))
    } catch {
      // Ignore storage errors.
    }
  }, [hidden])

  // Read the shared gallery from the server. On success, Cloudinary's list is
  // the source of truth, so anything deleted there disappears here too. On
  // failure we keep the last known gallery and show a message instead. Runs on
  // load, when the tab becomes visible again, and after a manual refresh.
  useEffect(() => {
    let cancelled = false

    async function syncFromServer() {
      const result = await fetchServerImages()
      if (cancelled) return
      setIsSyncing(false)

      if (result.error) {
        // Never throw away the cache just because the request failed.
        setSyncNote(result.error)
        return
      }

      // Nothing to call (for example under `vite dev`) — leave it as is.
      if (!result.images) return

      setSyncNote('')

      const serverImages = mergeImages(result.images)
      const serverIds = new Set(serverImages.map((image) => image.public_id))

      // Photos the server now lists no longer count as "pending".
      for (const id of [...pendingUploadsRef.current.keys()]) {
        if (serverIds.has(id)) pendingUploadsRef.current.delete(id)
      }

      // The server's list wins, so stale cached photos are dropped. We only add
      // back photos uploaded moments ago that the API has not listed yet.
      setImages(
        mergeImages(serverImages, [...pendingUploadsRef.current.values()])
      )
    }

    syncFromServer()

    function handleVisibility() {
      if (document.visibilityState === 'visible') syncFromServer()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [syncToken])

  // The visitor asked for a fresh list: show the busy state, then re-sync.
  const handleRefresh = useCallback(() => {
    setIsSyncing(true)
    setSyncToken((n) => n + 1)
  }, [])

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

      // 2. Send it to the unsigned upload endpoint. Drop the request after 60s
      // so a stalled connection reports a clear reason instead of hanging.
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      let response
      try {
        response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData, signal: controller.signal }
        )
      } finally {
        clearTimeout(timeoutId)
      }

      // Cloudinary replies with JSON, but a proxy or blocker can return
      // something else. Read it defensively so we can still report a reason.
      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      // 3. If Cloudinary reported an error, throw the real message + status
      if (!response.ok) {
        const detail = data?.error?.message
        throw new Error(
          detail
            ? `Cloudinary rejected the upload (${response.status}): ${detail}`
            : `Cloudinary rejected the upload (HTTP ${response.status}).`
        )
      }

      if (!data) {
        throw new Error(
          'Cloudinary accepted the upload but returned an unexpected (non-JSON) reply.'
        )
      }

      // 4. Add the new image to the top of the gallery (and remember it).
      const uploaded = slimImage(data)

      // Hold it as "pending" until the server list confirms it, so the next
      // sync does not briefly remove a photo that was just uploaded.
      pendingUploadsRef.current.set(uploaded.public_id, uploaded)
      setImages((prev) => mergeImages([uploaded], prev))

      // 5. Clear the picked file, its preview, and the hidden input
      setFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(describeUploadError(err))
    } finally {
      setIsUploading(false)
    }
  }

  // Everything the user has not removed on this device
  const shownImages = images.filter(
    (image) => !hidden.includes(image.public_id)
  )

  // The favorite images that are still in view (drives the heart count)
  const favoriteImages = shownImages.filter((image) =>
    favorites.includes(image.public_id)
  )

  // The list actually shown in the gallery (all images, or only favorites)
  const visibleImages = showFavorites ? favoriteImages : shownImages

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
        favoritesCount={favoriteImages.length}
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
              : 'Every photo you have uploaded, arranged in one place.'}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={BTN_GHOST}
              onClick={handleRefresh}
              disabled={isSyncing}
              title="Reload the latest gallery from Cloudinary"
            >
              {isSyncing ? 'Refreshing…' : 'Refresh gallery'}
            </button>
            {syncNote && (
              <span className="text-[0.82rem] text-orange">{syncNote}</span>
            )}
          </div>
        </div>

        {/* The All / Favorites switch only appears once there is something to show */}
        {shownImages.length > 0 && (
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
                {shownImages.length}
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
                {favoriteImages.length}
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
        <div className={`${SECTION_HEAD} mx-auto text-center`}>
          <h2 className={SECTION_TITLE}>Add to the collection</h2>
          <p className={SECTION_SUB}>
            Choose an image and send it to Cloudinary. It joins your gallery as
            soon as it uploads.
          </p>
        </div>

        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 rounded-lg border border-line bg-white/[0.04] p-7">
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
            <p className="text-center text-[0.9rem] text-orange">
              Uploading your image, please wait…
            </p>
          )}

          {error && (
            <p
              className="w-full rounded-sm border border-red-500/35 bg-red-500/[0.12] px-4 py-3 text-center text-[0.9rem] text-[#ffd9d9]"
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
