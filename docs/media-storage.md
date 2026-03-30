# Media Storage

## Recommended Setup

Use canonical site paths in content such as `/projects/tolu/photos/cover.jpg`, then
let production rewrite those paths to Cloudflare R2 during the build.

Keep project photos, posters, and stills in `public/` while you are editing or
generating responsive variants.

Keep large project videos out of normal Git history. Store them in external object
storage or a CDN, then let the site load them from remote URLs.

This repository is configured so that:
- published assets can keep stable site paths like `/projects/...`
- local and remote delivery can be switched for all published assets
- source masters can live outside `public/`
- deployed environments can load the same published paths from external storage

Important:
- content files should continue to store repo-style paths like `/projects/.../photos/...`
- those paths are rewritten to the remote host during the build when the
  relevant `PUBLIC_*` environment variables are present
- GitHub Pages now defaults to remote media delivery unless you explicitly override it

## What To Push

Push:
- code
- content files
- photos, posters, and still images
- generated responsive image variants
- small supporting assets that belong in the repo

Do not push large source or delivery videos into normal Git history.

## What Can Live Where?

Recommended split:
- laptop: code, config, and local master media under `media/masters/`
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

1. Add published images to `public/projects/<slug>/photos/` or another published folder under `public/`.
2. Keep content references canonical, for example `/projects/<slug>/photos/cover.jpg`.
3. Run `npm run images:responsive` after adding or replacing JPEG assets.
4. Run `R2_BUCKET_NAME=danieloye-media npm run media:upload:r2` to upload all published assets currently under `public/`.
5. Use `npm run r2:list -- projects/<slug>/photos/` when you want to confirm the object keys in R2.
6. Use `npm run build:remote` when you want to verify a local build resolves published media to Cloudflare.
7. In production, GitHub Pages will now default to remote asset, image, and video delivery.

## Uploading Published Media To R2

This repository includes a helper for uploading published assets from `public/`
plus any local project videos to R2:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
```

## Listing Published Media In R2

When you already uploaded files and want to copy their canonical site paths into
content, use:

```bash
npm run r2:list -- projects/tolu/photos/
```

This prints paths like `/projects/tolu/photos/DSC04460A.jpg`, which can be pasted
directly into project frontmatter.
