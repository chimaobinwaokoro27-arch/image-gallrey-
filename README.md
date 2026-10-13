# Cloudinary Image Gallery

A small React practice project. Pick an image from your computer, upload it to
Cloudinary with an **unsigned upload preset**, and view it in a gallery that is
kept between visits.

## Features

- Select an image with a file input
- Upload it to Cloudinary's Upload API using `FormData`
- Loading state ("Uploading...") while the request is in progress
- Shows the uploaded image using the URL Cloudinary returns (`secure_url`)
- Keeps every uploaded image in a gallery that survives a refresh
- Shows the **whole collection on every device** — a small serverless function lists the Cloudinary account with the Admin API
- Shows **resized thumbnails** using Cloudinary URL transformations
- Clear error message if an upload fails

## Tech

React + Vite (JavaScript) with **Tailwind CSS v4** for styling. No UI framework —
every style is a Tailwind utility class in the JSX.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (it is already ignored by Git):

   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
   ```

   Get these from your Cloudinary dashboard:
   - **Cloud name**: shown on the Dashboard.
   - **Upload preset**: *Settings → Upload → Upload presets → Add upload preset*.
     Set **Signing Mode** to **Unsigned**.

3. Start the dev server:

   ```bash
   npm run dev
   ```

> Vite reads `.env` only when it starts, so restart the server after changing it.

## Showing photos across devices (optional)

To list *every* photo in the Cloudinary account (so uploads appear on any
device), the app calls `/api/photos`, a serverless function that uses the
Cloudinary **Admin API**. That needs three extra values which must stay
**server-side** — never prefix them with `VITE_`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Find the key and secret in the Cloudinary console under **Settings → API Keys**.

- **On Vercel:** add them in *Project → Settings → Environment Variables*, then
  redeploy.
- **Locally:** test the function with `npx vercel dev` (plain `npm run dev`
  does not run serverless functions — the app then just uses the browser copy).

If these values are missing the function replies with a clear message and the
app quietly falls back to the images saved in the browser.

## Project structure

```
index.html          The single page that loads the React app
src/main.jsx        Entry point: mounts <App /> into #root
src/App.jsx         The whole app (upload + gallery)
src/index.css       Tailwind entry: theme tokens + a few custom keyframes
src/components/     Navbar, Hero and the inline SVG icons
api/photos.js       Serverless function: lists images via the Cloudinary Admin API
.env                Your Cloudinary settings (not committed)
```

## How the thumbnail works

The original URL Cloudinary returns looks like:

```
https://res.cloudinary.com/<cloud>/image/upload/v1234/photo.jpg
```

We generate a small version by inserting a transformation after `/image/upload/`:

```
https://res.cloudinary.com/<cloud>/image/upload/w_300,h_300,c_fill,q_auto,f_auto/v1234/photo.jpg
```

So the image is only uploaded **once**, and Cloudinary does the resizing.
