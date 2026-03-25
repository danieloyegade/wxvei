# Cloudflare Pages + R2 Setup

This project is already compatible with Cloudflare Pages for the site and R2 for
public media delivery.

## What This Repository Already Does

- `npm run build` outputs the static site to `dist/`
- project videos can load from `PUBLIC_PROJECT_VIDEO_BASE_URL`
- project images and site photos can optionally load from `PUBLIC_MEDIA_BASE_URL`
- favicons and fonts can optionally load from `PUBLIC_MEDIA_BASE_URL`
- large local video files are ignored by Git

## Cloudflare Pages Project

Use these values when creating the Pages project:

- Framework preset: `Astro`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The site already uses `https://danieloye.com` as its canonical site URL in
`astro.config.mjs`.

## R2 Bucket Recommendation

Use one bucket for public portfolio media.

Suggested bucket name:
- `danieloye-media`

Suggested public hostname:
- `media.danieloye.com`

Your deployed site will then request media like:
- `https://media.danieloye.com/projects/someplace-else/videos/feature.mp4`
- `https://media.danieloye.com/projects/jamine/photos/cover.jpg`

## Required Dashboard Steps

These steps require your Cloudflare account and cannot be completed from this
repository alone:

1. Create or finish the Cloudflare Pages project for this repo.
2. Create an R2 bucket.
3. Enable a public URL for the bucket.
4. Preferably connect the bucket to a custom domain such as `media.danieloye.com`.
5. In Pages project settings, add:
   - `PUBLIC_ASSET_SOURCE=remote`
   - `PUBLIC_MEDIA_BASE_URL=https://media.danieloye.com`
   - `PUBLIC_VIDEO_SOURCE=remote`
   - `PUBLIC_PROJECT_VIDEO_BASE_URL=https://media.danieloye.com`
6. Redeploy the Pages project after the environment variable is saved.

If you also want all published images to load from R2, add:
- `PUBLIC_IMAGE_SOURCE=remote`

## Uploading Videos To R2

This repository includes a helper script for uploading the local project videos
to a bucket with Wrangler.

Preview the local video manifest:

```bash
npm run videos:manifest
```

Dry-run the upload commands:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run videos:upload:r2
```

Run the actual upload:

```bash
R2_BUCKET_NAME=danieloye-media npm run videos:upload:r2
```

If you want to upload the tracked published assets as well:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
```

The uploader sends files from `public/projects/**/videos/*` to matching object
keys inside the bucket, so the URL structure stays aligned with the existing
content files.

## Current Local Video Inventory

At the time this guide was added, the project videos on disk are:

- `public/projects/annabella/videos/AnnabellaFINAL.mov`
- `public/projects/moving-images-in-g-sharp-minor/videos/feature.mov`
- `public/projects/of-the-sublime-and-beautiful/videos/feature.mp4`
- `public/projects/saucony/videos/feature.mp4`
- `public/projects/someplace-else/videos/feature.mp4`

## Suggested Rollout

1. Let Pages finish the first deploy.
2. Create the R2 bucket and public media domain.
3. Upload the current videos.
4. Add the relevant media environment variables to Pages.
5. Redeploy.
6. Once production is confirmed, remove any large local delivery copies you do
   not need on your laptop.
