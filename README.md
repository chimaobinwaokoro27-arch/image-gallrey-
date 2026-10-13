# Cloudinary Image Gallery

A small React practice project. Pick an image from your computer, upload it to
Cloudinary with an **unsigned upload preset**, and view it in a session gallery.

## Features

- Select an image with a file input
- Upload it to Cloudinary's Upload API using `FormData`
- Loading state ("Uploading...") while the request is in progress
- Shows the uploaded image using the URL Cloudinary returns (`secure_url`)
- Keeps every uploaded image in a gallery for the current session
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

## Project structure

```
index.html          The single page that loads the React app
src/main.jsx        Entry point: mounts <App /> into #root
src/App.jsx         The whole app (upload + gallery)
src/index.css       Tailwind entry: theme tokens + a few custom keyframes
src/components/     Navbar, Hero and the inline SVG icons
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
