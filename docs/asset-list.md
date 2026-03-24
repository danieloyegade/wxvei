# Asset List

## Purpose

This file tracks the placeholder asset structure defined by the Daniel Oyegade technical specification so files can be swapped cleanly during implementation.

## Base Image Location

Store placeholder and production-ready image assets in:
- `public/images/`

If detail-image organization is needed later, a nested project structure may be used:
- `public/images/projects/`

## Required Intro Asset

- `public/images/intro-image.jpg`

Alternative formats mentioned by the specification:
- `public/images/intro-image.webp`
- `public/images/intro-image.png`

Use one canonical intro filename only.

## Required Placeholder Project Covers

- `public/images/project-1.jpg`
- `public/images/project-2.jpg`
- `public/images/project-3.jpg`
- `public/images/project-4.jpg`
- `public/images/project-5.jpg`
- `public/images/project-6.jpg`
- `public/images/project-7.jpg`
- `public/images/project-8.jpg`
- `public/images/project-9.jpg`
- `public/images/project-10.jpg`

## Optional Detail Image Naming Convention

If a project has additional images, use lowercase hyphenated filenames such as:
- `public/images/project-1-detail-1.jpg`
- `public/images/project-1-detail-2.jpg`
- `public/images/project-2-detail-1.jpg`

An alternative nested structure referenced by the specification is:
- `public/images/projects/project-1.jpg`
- `public/images/projects/project-1-detail-1.jpg`
- `public/images/projects/project-1-detail-2.jpg`
- `public/images/projects/project-2.jpg`
- `public/images/projects/project-2-detail-1.jpg`

## Naming Rules

- Keep filenames lowercase.
- Use hyphens instead of spaces.
- Keep naming predictable for easy replacement in VS Code.
- Preserve a single canonical filename per asset where possible.

## Per-Project Preparation Checklist

For each project, prepare:
- 1 main cover image
- optional short descriptor
- optional additional detail images
- optional year / role / medium
