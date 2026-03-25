# Asset List

## Purpose

This file tracks the current public asset convention so project media stays grouped, predictable, and easy to replace.

## Public Structure

Project media now lives under:
- `public/projects/<slug>/photos/`
- `public/projects/<slug>/videos/`

Non-project imagery lives under:
- `public/site/photos/`

## Project Conventions

Use these canonical filenames when adding or replacing project assets:
- `public/projects/<slug>/photos/cover.jpg`
- `public/projects/<slug>/videos/feature.mp4`
- `public/projects/<slug>/photos/stills/still-1.jpg`
- `public/projects/<slug>/photos/stills/still-2.jpg`
- `public/projects/<slug>/photos/stills/still-3.jpg`

If a source file needs a different extension, keep the same base name:
- `feature.mov`
- `cover.png`

If you want a lighter hover clip later, add another file inside the same project's `videos` folder and point `hoverPreview.src` at it in the project frontmatter.

## Current Site Assets

- `public/site/photos/daniel-oyegade.jpg`

## Current Video Projects

- `public/projects/annabella/photos/cover.jpg`
- `public/projects/annabella/videos/AnnabellaFINAL.mp4`
- `public/projects/annabella/photos/stills/`
- `public/projects/moving-images-in-g-sharp-minor/photos/cover.jpg`
- `public/projects/moving-images-in-g-sharp-minor/videos/feature.mp4`
- `public/projects/moving-images-in-g-sharp-minor/photos/stills/`
- `public/projects/someplace-else/photos/cover.jpg`
- `public/projects/someplace-else/videos/feature.mp4`
- `public/projects/someplace-else/photos/stills/`
- `public/projects/of-the-sublime-and-beautiful/photos/cover.jpg`
- `public/projects/of-the-sublime-and-beautiful/videos/feature.mp4`
- `public/projects/of-the-sublime-and-beautiful/photos/stills/`

## Other Project Folders Prepared

- `public/projects/jamine/photos/cover.jpg`
- `public/projects/rectangle-with-embellishments/photos/cover.jpg`
- `public/projects/telfar-with-embelishments/photos/cover.jpg`
- `public/projects/home-improvement/photos/cover.jpg`
- `public/projects/spectres-under-glass/photos/cover.jpg`
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
