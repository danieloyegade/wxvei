# Media Storage

## Recommended Setup

Keep project photos, posters, and stills in the repository.

Keep large project videos out of normal Git history. Store them in external object
storage or a CDN, then let the site load them from remote URLs.

This repository is configured so that:
- local and remote media can be switched independently for images and videos
- large local video files are ignored by Git
- deployed environments can load the same paths from external storage

## What To Push

Push:
- code
- content files
- photos, posters, and still images
- small supporting assets that belong in the repo

Do not push large source or delivery videos into normal Git history.

## What Can Live Where?

Recommended split:
- laptop: code, tracked site images, config
- Cloudflare R2: published videos, and optionally published images
- SSD: masters, archive files, oversized local working copies

## Do The Videos Need To Stay On Your Laptop?

No. If your videos live in external storage, your laptop does not need to keep local
copies all the time.

You only need local copies when you want to edit, re-export, or preview them locally
without the remote storage URL configured.

## Environment Variables

Use these switches:

- `PUBLIC_IMAGE_SOURCE=local|remote`
- `PUBLIC_VIDEO_SOURCE=local|remote`

Optional shared media host:

- `PUBLIC_MEDIA_BASE_URL=https://your-media-domain.com`

Optional video-specific override:

- `PUBLIC_PROJECT_VIDEO_BASE_URL=https://your-media-domain.com`

Examples:

Remote videos, local images:

```bash
PUBLIC_IMAGE_SOURCE=local
PUBLIC_VIDEO_SOURCE=remote
PUBLIC_PROJECT_VIDEO_BASE_URL=https://your-media-domain.com
```

Remote images and remote videos:

```bash
PUBLIC_IMAGE_SOURCE=remote
PUBLIC_VIDEO_SOURCE=remote
PUBLIC_MEDIA_BASE_URL=https://your-media-domain.com
```

Resolved example:

- repo path: `/projects/someplace-else/videos/feature.mp4`
- resolved URL: `https://your-media-domain.com/projects/someplace-else/videos/feature.mp4`

## Suggested Workflow

1. Keep web-ready site images in the repo unless you deliberately switch to remote images.
2. Upload delivery-ready videos to storage.
3. Set `PUBLIC_VIDEO_SOURCE=remote` in local and production environments.
4. Keep masters and archive files on your SSD.
5. If you want the full site to run without local media files, upload the published images too and set `PUBLIC_IMAGE_SOURCE=remote`.

## Uploading Published Media To R2

This repository includes a helper for uploading tracked published images plus
any local project videos to R2:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
```
