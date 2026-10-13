// Serverless function (runs on Vercel) that lists the images in the Cloudinary
// account using the Admin API. The API secret lives only here, on the server —
// it is never sent to the browser and is never bundled into the app.
//
//   GET /api/photos  ->  { images: [ { public_id, secure_url, width, height, created_at } ] }
//
// Environment variables (set them in Vercel, WITHOUT the VITE_ prefix so they
// stay server-side):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

// The Admin API is authenticated with HTTP Basic auth: "key:secret".
function authHeader() {
  return `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`
}

// Send the browser only the fields the gallery needs — never the whole
// Cloudinary resource (which includes account-ish details).
function toPublicImage(resource) {
  return {
    public_id: resource.public_id,
    secure_url: resource.secure_url,
    width: resource.width,
    height: resource.height,
    created_at: resource.created_at,
  }
}

export default async function handler(req, res) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    res.status(500).json({
      error:
        'Cloudinary admin credentials are not set on the server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your Vercel project settings.',
    })
    return
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  try {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=500`
    const response = await fetch(url, { headers: { Authorization: authHeader() } })
    const data = await response.json()

    if (!response.ok) {
      res.status(response.status).json({
        error: data.error?.message || 'Cloudinary rejected the request.',
      })
      return
    }

    // Newest first, so the most recent upload is at the top of the gallery.
    const images = (data.resources || [])
      .map(toPublicImage)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // A little caching keeps the gallery snappy without hiding brand-new uploads
    // for long.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')
    res.status(200).json({ images })
  } catch (err) {
    res.status(500).json({
      error: err?.message || 'Unexpected error talking to Cloudinary.',
    })
  }
}
