# Media Storage

## Recommended Setup

Keep project photos, posters, and stills in the repository.

Keep large project videos out of normal Git history. Store them in external object
storage or a CDN, then let the site load them from `PUBLIC_PROJECT_VIDEO_BASE_URL`.

This repository is configured so that:
- local files like `public/projects/<slug>/videos/feature.mp4` are still useful for development
- large local video files are ignored by Git
- deployed environments can load the same paths from external storage

## What To Push

Push:
- code
- content files
- photos, posters, and still images
- small supporting assets that belong in the repo

Do not push large source or delivery videos into normal Git history.

## Do The Videos Need To Stay On Your Laptop?

No. If your videos live in external storage, your laptop does not need to keep local
copies all the time.

You only need local copies when you want to edit, re-export, or preview them locally
without the remote storage URL configured.

## Environment Variable

Set this in your deployment platform when your videos are uploaded to storage:

`PUBLIC_PROJECT_VIDEO_BASE_URL=https://your-media-domain.com`

Example:
- repo path: `/projects/someplace-else/videos/feature.mp4`
- resolved URL: `https://your-media-domain.com/projects/someplace-else/videos/feature.mp4`

## Suggested Workflow

1. Upload delivery-ready videos to storage.
2. Set `PUBLIC_PROJECT_VIDEO_BASE_URL` in production.
3. Keep local video masters outside the repo, or leave temporary local copies in `public/projects/.../videos/` while working.
4. Push the repo without the large video files.
