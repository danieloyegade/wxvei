# Content Publisher Workflow

This repository now includes a manifest-driven publisher at
`scripts/publish-content.mjs`.

It does four things in one pass:

1. Takes a project or blog manifest.
2. Normalizes the supplied images into site-ready JPEG assets.
3. Uploads the generated media to Cloudflare R2.
4. Writes the matching Astro content file so the site has a new page to render.

For project uploads, the script also updates the internal section registry for:

- `mixed-media`
- `portraiture`
- `short-films`

`selected-work` does not need a registry entry.

## Command

```bash
R2_BUCKET_NAME=danieloye-media npm run content:publish -- --manifest /absolute/path/to/manifest.json
```

Preview the run without writing files or uploading anything:

```bash
R2_BUCKET_NAME=danieloye-media npm run content:publish -- --manifest /absolute/path/to/manifest.json --dry-run
```

If you only want to generate the content file and skip the Cloudflare upload:

```bash
npm run content:publish -- --manifest /absolute/path/to/manifest.json --skip-upload
```

## Chat Template: Project

Paste this into Codex and attach the relevant files, or replace the asset entries
with absolute paths from your SSD.

```text
Create a new project with this upload template.

Type: project
Project name: <PROJECT NAME>
Section: <selected-work | mixed-media | portraiture | short-films>
Descriptor: <short card description>
Project information:
- <line 1>
- <line 2>
- <line 3>
Credits:
- <role>: <name>
- <role>: <name>
Body copy:
<Markdown paragraphs for the project page>

Image files:
- <attached image or /absolute/path/to/image-1.jpg>
- <attached image or /absolute/path/to/image-2.jpg>
- <attached image or /absolute/path/to/image-3.jpg>

Video files:
- <attached video or /absolute/path/to/feature.mp4>
- <attached video or /absolute/path/to/detail.mov>

Optional overrides:
- slug: <custom-slug>
- hover preview start: <seconds>
- hover preview end: <seconds>
- layout pattern: <lead-left | support-right | wide-band | support-left | lead-right | paired-left | paired-right | hero-left | tail-right | offset-right>
- visual weight: <support | standard | dominant | hero>
- crop focus: <center | top | upper-third>
- delete source after upload: <yes | no>
```

## Chat Template: Blog Post

```text
Create a new blog post with this upload template.

Type: blog-post
Title: <POST TITLE>
Excerpt: <short summary for the list page>
Published at: <YYYY-MM-DD or leave blank for today>
Body copy:
<Markdown body>

Image files:
- <attached image or /absolute/path/to/cover.jpg>
- <attached image or /absolute/path/to/detail-1.jpg>
- <attached image or /absolute/path/to/detail-2.jpg>

Optional overrides:
- slug: <custom-slug>
- cover alt: <accessible description>
- status: <published | draft>
- delete source after upload: <yes | no>
```

## JSON Manifest: Project

This is the file shape the script expects if you want to run it directly.

```json
{
  "type": "project",
  "title": "Project Name",
  "section": "portraiture",
  "descriptor": "Short card description.",
  "metadata": [
    "London, 2026",
    "Digital photography"
  ],
  "credits": [
    {
      "role": "Creative Direction",
      "name": "Daniel Oyegade"
    }
  ],
  "body": "Markdown body copy for the project page.",
  "images": [
    "/Volumes/SSD/Project/image-1.jpg",
    "/Volumes/SSD/Project/image-2.jpg",
    "/Volumes/SSD/Project/image-3.jpg"
  ],
  "videos": [
    "/Volumes/SSD/Project/feature.mp4"
  ],
  "hoverPreview": {
    "startTime": 0,
    "endTime": 8
  },
  "deleteSourceAfterUpload": true
}
```

## JSON Manifest: Blog Post

```json
{
  "type": "blog-post",
  "title": "Post Title",
  "excerpt": "Short summary for the blog index.",
  "publishedAt": "2026-03-25",
  "body": "Markdown body copy for the article.",
  "images": [
    "/Volumes/SSD/Post/cover.jpg",
    "/Volumes/SSD/Post/detail-1.jpg"
  ],
  "coverAlt": "Editorial still from the post",
  "deleteSourceAfterUpload": false
}
```

## Output Conventions

Projects:

- cover image becomes `/projects/<slug>/photos/cover.jpg`
- extra images become `/projects/<slug>/photos/detail-01.jpg`, etc.
- mixed media assets upload to `/projects/mixed-media/<slug>/...` in R2 but still use the same content-facing paths as the rest of the site
- first video becomes `/projects/<slug>/videos/feature.<ext>`
- additional videos become `/projects/<slug>/videos/detail-01.<ext>`, etc.

Blog posts:

- cover image becomes `/blog/<slug>/cover.jpg`
- extra images become `/blog/<slug>/detail-01.jpg`, etc.

## Important Note

This workflow uploads media straight to R2 and creates the matching Astro content
entry locally. Because the site is still content-file driven, the new page becomes
live after the normal site deploy for this repository.
