# Media Storage

## Recommended Setup

Keep project photos, posters, and stills in the repository.

Keep large project videos out of normal Git history. Store them in external object
storage or a CDN, then let the site load them from remote URLs.

This repository is configured so that:
- local and remote media can be switched for all published assets
- large local video files are ignored by Git
- deployed environments can load the same paths from external storage

Important:
- content files continue to store repo-style paths like `/projects/.../videos/...`
- those paths are only rewritten to a remote host during the build when the
  relevant `PUBLIC_*` environment variables are present

## What To Push

Push:
- code
- content files
- photos, posters, and still images
- small supporting assets that belong in the repo

Do not push large source or delivery videos into normal Git history.

## What Can Live Where?

Recommended split:
- laptop: code and config
- Cloudflare R2: published project media, site photos, fonts, favicons
- SSD: masters, archive files, oversized local working copies

## Do The Videos Need To Stay On Your Laptop?

No. If your videos live in external storage, your laptop does not need to keep local
copies all the time.

You only need local copies when you want to edit, re-export, or preview them locally
without the remote storage URL configured.

## Environment Variables

Use these switches:

- `PUBLIC_ASSET_SOURCE=local|remote`
- `PUBLIC_IMAGE_SOURCE=local|remote`
- `PUBLIC_VIDEO_SOURCE=local|remote`

Optional shared media host:

- `PUBLIC_MEDIA_BASE_URL=https://your-media-domain.com`

Optional video-specific override:

- `PUBLIC_PROJECT_VIDEO_BASE_URL=https://your-media-domain.com`

Examples:

Remote everything:

```bash
PUBLIC_ASSET_SOURCE=remote
PUBLIC_MEDIA_BASE_URL=https://your-media-domain.com
```

Remote videos, local images:

```bash
PUBLIC_ASSET_SOURCE=local
PUBLIC_IMAGE_SOURCE=local
PUBLIC_VIDEO_SOURCE=remote
PUBLIC_PROJECT_VIDEO_BASE_URL=https://your-media-domain.com
```

Remote images and remote videos:

```bash
PUBLIC_ASSET_SOURCE=remote
PUBLIC_MEDIA_BASE_URL=https://your-media-domain.com
```

Resolved example:

- repo path: `/projects/someplace-else/videos/feature.mp4`
- resolved URL: `https://your-media-domain.com/projects/someplace-else/videos/feature.mp4`

## Suggested Workflow

1. Upload published assets to storage.
2. Set the `PUBLIC_*` media variables in the actual production build environment.
3. In this repository today, that means GitHub Actions variables used by
   `.github/workflows/deploy.yml`.
4. Keep masters and archive files on your SSD.
5. Keep local copies only when you need offline editing or re-export work.

## Uploading Published Media To R2

This repository includes a helper for uploading tracked published assets from
`public/` plus any local project videos to R2:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
```
