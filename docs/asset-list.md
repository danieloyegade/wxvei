# Asset List

## Purpose

This file tracks the canonical published asset convention so project media stays
grouped, predictable, and easy to replace whether it is staged locally or stored
in Cloudflare R2.

## Published Structure

When staged locally, published assets continue to live under:
- `public/projects/<slug>/photos/`
- `public/projects/<slug>/videos/`
- `public/projects/mixed-media/<slug>/photos/`

Non-project imagery lives under:
- `public/site/photos/`

In R2, those same assets live without the `public/` prefix:
- `projects/<slug>/photos/`
- `projects/<slug>/videos/`
- `projects/mixed-media/<slug>/photos/`
- `site/photos/`

Local pulls from R2 now default to:
- `.media-cache/`

Source masters still live outside the published tree:
- `media/masters/projects/<slug>/videos/`

## Project Conventions

Use these canonical filenames when adding or replacing project assets:
- `public/projects/<slug>/photos/cover.jpg`
- `public/projects/<slug>/videos/feature.mp4`
- `public/projects/<slug>/videos/preview.mp4`
- `public/projects/<slug>/photos/stills/still-1.jpg`
- `public/projects/<slug>/photos/stills/still-2.jpg`
- `public/projects/<slug>/photos/stills/still-3.jpg`

Source masters can keep their original names and extensions under `media/masters/`.
Published web-delivery assets should stay canonical in key shape even when R2 is
the source of truth.

Run:

- `npm run videos:prepare` to generate delivery MP4s and preview clips
- `npm run images:responsive` to generate responsive JPEG variants
- `npm run media:push:r2 -- --source <folder> --prefix projects/<slug>/photos/` to push a local working folder into R2
- `npm run media:pull:r2 -- --prefix projects/<slug>/photos/` to restore a project into a local cache
- `npm run media:validate:r2 -- --prefix projects/<slug>/` to confirm the referenced objects exist remotely

## Current Site Assets

- `public/site/photos/daniel-oyegade.jpg`

## Current Video Projects

- `public/projects/annabella/photos/cover.jpg`
- `media/masters/projects/annabella/videos/AnnabellaFINAL.mp4`
- `public/projects/annabella/photos/stills/`
- `public/projects/moving-images-in-g-sharp-minor/photos/cover.jpg`
- `media/masters/projects/moving-images-in-g-sharp-minor/videos/feature.mov`
- `public/projects/moving-images-in-g-sharp-minor/photos/stills/`
- `public/projects/someplace-else/photos/cover.jpg`
- `media/masters/projects/someplace-else/videos/feature.mp4`
- `public/projects/someplace-else/photos/stills/`
- `public/projects/of-the-sublime-and-beautiful/photos/cover.jpg`
- `media/masters/projects/of-the-sublime-and-beautiful/videos/feature.mp4`
- `public/projects/of-the-sublime-and-beautiful/photos/stills/`

## Other Project Folders Prepared

- `public/projects/jamine/photos/cover.jpg`
- `public/projects/mixed-media/rectangle-with-embellishments/photos/cover.jpg`
- `public/projects/mixed-media/telfar-with-embelishments/photos/cover.jpg`
- `public/projects/mixed-media/home-improvement/photos/cover.jpg`
- `public/projects/mixed-media/spectres-under-glass/photos/cover.jpg`
- `public/projects/reny/photos/cover.jpg`
- `public/projects/mia/photos/cover.jpg`
- `public/projects/annabella/photos/cover.jpg`
- `public/projects/abiola/photos/cover.jpg`
- `public/projects/zealots/photos/cover.jpg`
- `public/projects/lola/photos/cover.jpg`
- `public/projects/dj-paullette-for-seen-mag/photos/cover.jpg`
- `public/projects/isaac/photos/cover.jpg`
- `public/projects/saucony/videos/feature.mp4`
- `public/projects/soft-machine/photos/cover.jpg`

## Naming Rules

- Keep folders slug-based.
- Use lowercase, stable filenames like `cover`, `feature`, and `still-1`.
- Keep all media for a project inside its own folder.
- Keep canonical object keys stable even if the local working folder changes.
