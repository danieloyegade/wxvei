# GitHub Pages + Cloudflare R2 Setup

This repository currently deploys the site with GitHub Pages and uses Cloudflare
R2 as the public media host for videos, images, fonts, favicons, and other
published assets.

Local development now follows the same default: `npm run dev`, `npm run build`,
and `npm run preview` all resolve published media to Cloudflare unless you
intentionally use the `:local` variants.

## What This Repository Already Does

- `npm run build` outputs the static site to `dist/`
- GitHub Actions deploys `main` with `.github/workflows/deploy.yml`
- project videos can load from `PUBLIC_PROJECT_VIDEO_BASE_URL`
- project images and site photos can load from `PUBLIC_MEDIA_BASE_URL`
- favicons, fonts, and other published assets can load from `PUBLIC_MEDIA_BASE_URL`
- large local video files are ignored by Git

## Important Behavior

Content files keep paths like `/projects/someplace-else/videos/feature.mp4`.
Those paths become `https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev/...` during the build when
the matching `PUBLIC_*` variables are set. This repository's GitHub Pages deploy
now defaults those variables to remote values, so production serves published
media from Cloudflare unless you intentionally override the defaults.

## R2 Bucket Recommendation

Use one bucket for public portfolio media.

Suggested bucket name:
- `danieloye-media`

Suggested public hostname:
- `media.danieloye.com`

Current working public hostname:
- `pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev`

Your deployed site will then request media like:
- `https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev/projects/someplace-else/videos/feature.mp4`
- `https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev/projects/jamine/photos/cover.jpg`

## Required Setup

These account-level steps still need to be completed outside the repository:

1. Create or confirm the R2 bucket.
2. Enable a public URL for the bucket.
3. Preferably connect the bucket to a custom domain such as `media.danieloye.com`.
4. In GitHub Actions repository variables or the `github-pages` environment, add:
   - `PUBLIC_VIDEO_SOURCE=remote`
   - `PUBLIC_PROJECT_VIDEO_BASE_URL=https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev`
5. For images, fonts, favicons, and other published assets, add:
   - `PUBLIC_ASSET_SOURCE=remote`
   - `PUBLIC_IMAGE_SOURCE=remote`
   - `PUBLIC_MEDIA_BASE_URL=https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev`
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

For published images and other assets, the uploader now scans `public/` directly,
so newly added assets do not need to be committed before you upload them to R2.

If you want to inspect an existing R2 prefix and copy canonical content paths
back into frontmatter, use:

```bash
npm run r2:list -- projects/tolu/photos/
```

If you want to scaffold a new project file directly from an R2 prefix, use:

```bash
npm run project:new:r2 -- \
  --title "Tolu" \
  --prefix projects/tolu/photos/ \
  --section portraiture:1 \
  --descriptor "Manchester 2026."
```

For a Cloudflare-first authoring workflow, these commands are now available too:

```bash
npm run media:push:r2 -- --source ~/Exports/Tolu --prefix projects/tolu/photos/
npm run media:pull:r2 -- --prefix projects/tolu/photos/
npm run media:validate:r2 -- --prefix projects/tolu/
```

That lets you keep R2 as the source of truth for published media while using local
folders only as temporary working copies or caches.

## Current Local Video Inventory

At the time this guide was added, the project videos on disk are:

- `public/projects/annabella/videos/AnnabellaFINAL.mp4`
- `public/projects/moving-images-in-g-sharp-minor/videos/feature.mp4`
- `public/projects/of-the-sublime-and-beautiful/videos/feature.mp4`
- `public/projects/saucony/videos/feature.mp4`
- `public/projects/someplace-else/videos/feature.mp4`

## Suggested Rollout

1. Create the R2 bucket and public media domain.
2. Upload the current published media.
3. Add the relevant GitHub Actions variables and secret.
4. Re-run `Deploy to GitHub Pages`.
5. Confirm the generated media URLs point to `https://pub-8f9c84a430fe4288a47ed8a11d8c12be.r2.dev/...`.
6. Once production is confirmed, keep content paths canonical and use `media:push:r2`, `media:pull:r2`, and `media:validate:r2` for day-to-day Cloudflare-first project work.
