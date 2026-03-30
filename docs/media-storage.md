# Media Storage

## Recommended Setup

Use canonical site paths in content such as `/projects/tolu/photos/cover.jpg`, then
let production rewrite those paths to Cloudflare R2 during the build.

Treat Cloudflare R2 as the source of truth for published media. Keep local folders
as working copies, export folders, or disposable caches when you are editing,
regenerating assets, or pulling a project back down to a machine.

Keep large project videos and masters out of normal Git history. Store published
delivery assets in R2 and keep masters in separate backup storage.

This repository is configured so that:
- published assets can keep stable site paths like `/projects/...`
- local and remote delivery can be switched for all published assets
- source masters can live outside the repo
- deployed environments can load the same published paths from external storage

Important:
- content files should continue to store repo-style paths like `/projects/.../photos/...`
- those paths are rewritten to the remote host during the build when the
  relevant `PUBLIC_*` environment variables are present
- local dev, preview, and GitHub Pages now default to remote media delivery unless you explicitly override them
- `public/` is still supported as an optional staging area, but it is no longer the only practical authoring path

## What To Push To Git

Push:
- code
- content files
- documentation
- small essential assets that truly belong in the repo

Do not rely on Git as the primary store for published project media if R2 is your
source of truth. Do not push large source or delivery videos into normal Git history.

## What Can Live Where?

Recommended split:
- laptop: code, config, temporary working folders, and optional `.media-cache/` pulls
- Cloudflare R2: published project media, site photos, fonts, favicons
- SSD or other backup: masters, archive files, oversized local working copies

## Do The Videos Need To Stay On Your Laptop?

No. If your videos live in external storage, your laptop does not need to keep local
copies all the time.

You only need local copies when you want to edit, re-export, inspect, or regenerate
assets. The repo now includes helpers for pushing a local folder to R2 and pulling
an R2 prefix back into a local cache.

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

1. Export finished delivery assets into any local folder you want to use for the project.
2. Push that folder directly to R2 with `npm run media:push:r2 -- --source <folder> --prefix projects/<slug>/photos/`.
3. Keep content references canonical, for example `/projects/<slug>/photos/cover.jpg`.
4. Use `npm run project:new:r2 -- ...` when you want to scaffold a new project file directly from an existing R2 prefix.
5. Run `npm run media:validate:r2 -- --prefix projects/<slug>/` before previewing or publishing a project.
6. Run `npm run dev` for localhost with Cloudflare-backed media.
7. Run `npm run build` or `npm run preview` for Cloudflare-backed local verification.
8. Use `npm run media:pull:r2 -- --prefix projects/<slug>/photos/` when you want to pull an existing project back down for editing or inspection.
9. Use `npm run dev:local`, `npm run build:local`, or `npm run preview:local` only when you intentionally want the old local-media behavior.

## Pushing A Local Folder To R2

Use the new direct uploader when R2 is the source of truth and your working files
do not live under `public/`:

```bash
npm run media:push:r2 -- \
  --source ~/Exports/Tolu \
  --prefix projects/tolu/photos/
```

For a repo-wide bulk upload from `public/`, the existing command still works:

```bash
DRY_RUN=1 R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
R2_BUCKET_NAME=danieloye-media npm run media:upload:r2
```

## Pulling A Project Back Down From R2

Use the pull helper when you want a local cache or working copy of a project:

```bash
npm run media:pull:r2 -- \
  --prefix projects/tolu/photos/ \
  --dest ./.media-cache/projects/tolu/photos
```

If `--dest` is omitted, files are pulled into `.media-cache/` automatically.

## Validating R2 Before Preview Or Publish

The validator scans `src/` for canonical asset paths, then checks that the
referenced objects exist in R2. For JPEG references it also checks the responsive
`-640`, `-960`, `-1440`, and `-1920` style variants that the site expects.

Validate the whole site:

```bash
npm run media:validate:r2
```

Validate a single project:

```bash
npm run media:validate:r2 -- --prefix projects/tolu/
```

## Responsive JPEG Variants

If you still want the repo to generate responsive JPEG variants for you, stage the
images under `public/` and run:

```bash
npm run images:responsive
```

If your export workflow already generates the required sizes outside the repo, you
can push those files directly with `media:push:r2` instead.

## Listing Published Media In R2

When you already uploaded files and want to copy their canonical site paths into
content, use:

```bash
npm run r2:list -- projects/tolu/photos/
```

This prints paths like `/projects/tolu/photos/DSC04460A.jpg`, which can be pasted
directly into project frontmatter.

## Scaffolding A Project From R2

When the images already live in R2, you can scaffold the project markdown in one
command:

```bash
npm run project:new:r2 -- \
  --title "Tolu" \
  --slug tolu \
  --prefix projects/tolu/photos/ \
  --section portraiture:1 \
  --descriptor "Manchester 2026." \
  --metadata "Manchester 2026"
```

The helper will:
- list the files in the R2 prefix
- choose `cover.*` as the hero image when present, otherwise use the first image
- write the remaining images into `detailImages`
- create `src/content/projects/<slug>.md`

You can preview the generated file without writing it:

```bash
npm run project:new:r2 -- \
  --title "Tolu" \
  --prefix projects/tolu/photos/ \
  --section portraiture:1 \
  --descriptor "Manchester 2026." \
  --dry-run
```

For multi-section projects, repeat `--section` and optionally add homepage placement:

```bash
npm run project:new:r2 -- \
  --title "Example" \
  --prefix projects/example/photos/ \
  --section selected-work:12 \
  --section portraiture:7 \
  --homepage 6:closing:2 \
  --descriptor "Portrait study."
```

## Localhost Behavior

The default local scripts now use Cloudflare-hosted media:

```bash
npm run dev
npm run build
npm run preview
```

If you ever need to force local filesystem assets instead, use:

```bash
npm run dev:local
npm run build:local
npm run preview:local
```
