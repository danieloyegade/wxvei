# GitHub Pages + Cloudflare R2 Setup

This repository currently deploys the site with GitHub Pages and uses Cloudflare
R2 as the optional public media host for videos, images, fonts, and favicons.

## What This Repository Already Does

- `npm run build` outputs the static site to `dist/`
- GitHub Actions deploys `main` with `.github/workflows/deploy.yml`
- project videos can load from `PUBLIC_PROJECT_VIDEO_BASE_URL`
- project images and site photos can optionally load from `PUBLIC_MEDIA_BASE_URL`
- favicons and fonts can optionally load from `PUBLIC_MEDIA_BASE_URL`
- large local video files are ignored by Git

## Important Behavior

Content files keep paths like `/projects/someplace-else/videos/feature.mp4`.
Those paths only become `https://media.danieloye.com/...` during the build when
the matching `PUBLIC_*` variables are set. Without those variables, production
keeps the local-style `/projects/...` URLs.

## R2 Bucket Recommendation

Use one bucket for public portfolio media.

Suggested bucket name:
- `danieloye-media`

Suggested public hostname:
- `media.danieloye.com`

Your deployed site will then request media like:
- `https://media.danieloye.com/projects/someplace-else/videos/feature.mp4`
- `https://media.danieloye.com/projects/jamine/photos/cover.jpg`

## Required Setup

These account-level steps still need to be completed outside the repository:

1. Create or confirm the R2 bucket.
2. Enable a public URL for the bucket.
3. Preferably connect the bucket to a custom domain such as `media.danieloye.com`.
4. In GitHub Actions repository variables or the `github-pages` environment, add:
   - `PUBLIC_VIDEO_SOURCE=remote`
   - `PUBLIC_PROJECT_VIDEO_BASE_URL=https://media.danieloye.com`
5. If you also want images, fonts, and favicons from R2, add:
   - `PUBLIC_ASSET_SOURCE=remote`
   - `PUBLIC_MEDIA_BASE_URL=https://media.danieloye.com`
6. For GitHub-triggered uploads, add:
   - variable `R2_BUCKET_NAME=danieloye-media`
   - variable `CLOUDFLARE_ACCOUNT_ID=<your-account-id>`
   - secret `CLOUDFLARE_API_TOKEN=<token with R2 write access>`
7. Redeploy GitHub Pages after the variables are saved.

If you intentionally move the whole site build to Cloudflare Pages later, use
the same `PUBLIC_*` variable names there.

## Uploading Videos To R2

This repository includes a helper script for uploading the local project videos
to a bucket with Wrangler.

You can now trigger uploads from GitHub Actions with
`.github/workflows/upload-media-to-r2.yml`
or run the local commands below.

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

1. Create the R2 bucket and public media domain.
2. Upload the current videos.
3. Add the relevant GitHub Actions variables and secret.
4. Re-run `Deploy to GitHub Pages`.
5. Confirm the generated video URLs point to `https://media.danieloye.com/...`.
6. Once production is confirmed, remove any large local delivery copies you do
   not need on your laptop.
