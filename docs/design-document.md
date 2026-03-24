# Daniel Oyegade Complete Technical Design Document (V1)

Portfolio site specification for the creative collective.

Prepared for:
- Daniel Oyegade collective website build

Purpose:
- Codex-ready design and implementation specification

## Project Overview

Daniel Oyegade is a high-end portfolio site for a creative collective. Version 1 is a proof of concept designed to function as a calling card: minimal, editorial, image-led, and expensive in feel without becoming over-designed.

The site is not a general agency brochure. It is a controlled visual statement.

Its primary purpose is to:
- present Daniel Oyegade as a serious creative collective
- foreground image-making, film, and creative direction
- create immediate visual confidence
- give the collective a coherent aesthetic identity
- be simple enough to build quickly and cleanly
- be structured so assets can be swapped in easily in VS Code and extended later

The site should feel like:
- a gallery wall
- a campaign contact sheet stripped to essentials
- a printed lookbook with digital motion

The site should not feel like:
- a startup landing page
- a generic agency template
- a flashy portfolio with gimmick interactions
- a faux-luxury student site

## Core Concept

Daniel Oyegade v1 is built around a short transition from an intro image into a scrolling work index.

The logic is:
1. Visitor lands on a full-screen intro image.
2. Floor labels descend through the frame.
3. The sequence holds briefly on Daniel Oyegade.
4. The intro image swipes upward.
5. The main site is revealed beneath.
6. The user lands directly in the work page.
7. The user scrolls through projects.
8. Project titles appear on hover.

This descent is not a decorative loading screen. It is the conceptual threshold into the collective’s world.

## Site Architecture (v1)

### Pages

### Intro / Entry State

A full-screen intro state that appears when the user first lands on the site.

Contains:
- one full-screen intro image
- descending floor labels
- final hold on Daniel Oyegade
- upward swipe reveal into the main page

### Main Page / Work Index

The main page of the site.

Contains:
- fixed site name at top left: Daniel Oyegade
- fixed navigation item at top right: INFORMATION
- freeform editorial project layout
- hover reveal of project titles and short descriptors
- vertical scrolling through selected projects

### Information Page

A secondary minimal page.

Contains:
- short collective statement
- team names and roles
- one concise paragraph about the collective
- contact details
- optional links later

### Project Pages (recommended for phase 1 if time allows)

Simple dedicated project pages.

Each page can contain:
- project title
- one-line descriptor
- selected images
- optional role credits
- back link to main page

If these are not built in the first pass, project cards can temporarily be non-clickable or link to placeholders.

## Brand and Positioning

### Brand Name

Daniel Oyegade

Always styled in uppercase for site identity and top-level navigation.

### Brand Tone

The tone should be:
- refined
- exacting
- editorial
- controlled
- fashion-adjacent
- culturally literate
- visually confident

The tone should not be:
- overly warm
- over-explained
- corporate
- exaggeratedly artistic
- aggressively luxurious
- jargon-heavy

### Positioning Summary

Daniel Oyegade is a creative collective focused on image, moving image, and direction. The visual identity should communicate seriousness and taste through restraint.

## Visual Direction

### Overall Visual Principles

The site should be based on:
- reduction
- strong image hierarchy
- generous white space
- asymmetry with discipline
- subtle motion
- typographic clarity

The site’s design language should feel architectural and calm rather than expressive in a loud way.

### Colour Direction

Keep the palette narrow.

#### Intro state
- image-led
- dark or tonally controlled presentation
- text must remain legible over image

#### Main site
- white or warm off-white background
- text in near-black
- no obvious accent colour in v1
- project imagery provides the colour on the page

Suggested working values:
- Background: off-white or pure white
- Primary text: near-black
- Hover text: white or near-white over image when needed
- Borders/rules if used: very light grey

No decorative gradients, glossy highlights, or loud accent tones.

## Typography System

### Type Strategy

Use a two-font system built around:
- Primary sans-serif: Satoshi
- Secondary serif: Cormorant Garamond

This pairing should create a balance between precision and editorial elegance without tipping into a serif-heavy luxury cliché.

The system should work like this:
- Satoshi carries the site’s main voice: navigation, labels, interface, captions, descriptors, and the overall structural language.
- Cormorant Garamond is used sparingly for selected editorial moments only, primarily where a slight shift in tone adds poise rather than decoration.

The serif must remain a controlled accent. It should feel disciplined, literary, and refined, not ornate, nostalgic, theatrical, or overly romantic.

### Typographic Intent

Typography across the site should feel:
- cool
- architectural
- sharp
- expensive through proportion, spacing, and restraint
- editorial without becoming florid
- contemporary without feeling tech-startup
- not theatrical
- not sci-fi
- not fake-operating-system UI

The overall effect should feel calm and exact. Typography should support the imagery, not compete with it.

### Primary Typeface: Satoshi

Satoshi should be the dominant typeface across the site.

Use Satoshi for:
- site name: Daniel Oyegade
- navigation
- intro floor labels
- descriptors / discipline lines
- information page structure
- captions and metadata
- interface text generally
- hover titles if the serif feels too fussy in testing

Recommended weights for v1:
- Regular
- Medium
- Bold

In practice, most of the site should sit in Regular and Medium, with Bold used sparingly.

### Secondary Typeface: Cormorant Garamond

Cormorant Garamond should be used selectively and with discipline.

Use Cormorant Garamond for:
- project titles on hover, if testing confirms it adds elegance without fussiness
- occasional editorial lines on the Information page
- project page titles or headings, if those pages are built in v1 or shortly after

Do not use the serif for navigation, captions, floor labels, metadata, or large amounts of body text.

The serif is not the brand’s main voice. It is a contrast device used to introduce a slight editorial softness against the harder architectural structure of Satoshi.

### Typographic Hierarchy

#### Site Name

Style the site name as:
- uppercase
- small to medium in size
- positioned with confidence and generous margins
- sharp, restrained, and not oversized
- set in Satoshi

Example style: Daniel Oyegade

#### Navigation

Navigation should be:
- small
- sharp
- restrained
- uppercase
- cleanly spaced
- set in Satoshi

Example style: INFORMATION

Avoid decorative small caps unless the font rendering genuinely supports them well. Standard uppercase is preferable for clarity and control.

#### Project Titles

Project titles should be:
- medium-sized
- clean
- confident
- readable over imagery
- set in title case
- preferably set in Cormorant Garamond, provided the result feels elegant rather than soft or indulgent

Example style: The Unclad Knight

If the serif introduces too much sentimentality or weakens the harder visual tone of the site, switch project titles back to Satoshi.

#### Captions / Descriptors

Captions and descriptors should be:
- very short
- understated
- smaller than project titles
- set with restrained line spacing
- set in Satoshi

Example style: Short film / nocturnal city study

These lines should frame the work without sounding inflated or over-written.

#### Intro Floor Labels

Intro floor labels should be:
- larger than the navigation
- smaller than huge hero branding
- in the same typographic world as the rest of the site
- set in Satoshi
- free of decorative UI styling
- clear, severe, and inevitable in tone

Sequence:
- EIGHTH FLOOR
- FOURTH FLOOR
- FIRST FLOOR
- GROUND FLOOR
- Daniel Oyegade

These labels should not feel dramatic or cinematic in an obvious way. They should feel calm, spatial, and architectural.

### Case Rules

Maintain the following case system consistently:
- Site identity: uppercase
- Navigation: uppercase
- Intro floor labels: uppercase
- Project titles: title case
- Descriptors: sentence case or title case, but remain consistent throughout the site

### Usage Balance

To avoid the site drifting into a serif-heavy luxury cliché, keep the font balance approximately as follows:
- Satoshi: 85–90%
- Cormorant Garamond: 10–15%

This ensures that the site remains grounded in a modern, controlled sans-serif structure, with the serif introduced only where it adds editorial precision and contrast.

### Fallback Principle

If the serif ever starts to feel too decorative, too romantic, or too self-conscious in context, default back to Satoshi. The site’s strength should come from image, spacing, hierarchy, and proportion first. The serif is optional emphasis, not a requirement to prove taste.

## Intro Sequence Design

### Purpose

The intro sequence is the site’s threshold. It introduces the descent motif and gives Daniel Oyegade a distinct conceptual identity.

### Layout

The intro screen contains:
- one full-screen image
- descending floor text
- no buttons
- no percentage loading indicator
- no decorative UI chrome

### Floor Label Sequence

The exact sequence is:
1. EIGHTH FLOOR
2. FOURTH FLOOR
3. FIRST FLOOR
4. GROUND FLOOR
5. Daniel Oyegade

### Motion Logic

Each label:
- appears lower on the page than the previous one
- replaces the previous label rather than stacking all labels visibly
- uses restrained motion only
- may combine slight fade and slight downward translation
- should not bounce, flash, or distort

### Timing

Recommended pacing:
- each floor label visible for approximately 300–500ms
- Daniel Oyegade holds slightly longer than the others
- total intro duration approximately 2.5–4 seconds

### Intro Image Transition

After the Daniel Oyegade hold:
- the full-screen intro image swipes upward as a single plane
- the main page is revealed beneath it
- motion is clean, direct, and architectural
- no flourish, no bounce, no exaggerated easing

### Intro Text Placement

The descending labels should occupy changing vertical positions in the frame. The descent should be readable at a glance.

Text must not feel like floating captions. It should feel spatial and deliberate.

### Intro Image Requirements

The intro image should:
- be full-screen
- be compositionally strong
- hold text well
- feel like a threshold image, not just a pretty image
- contain enough negative space or tonal consistency for the labels to remain legible

### Intro Asset Naming

For easy setup in VS Code, the intro image should be stored as:
- `intro-image.jpg`

Alternative if using a different format:
- `intro-image.webp`
- `intro-image.png`

Use one canonical filename only.

## Main Page / Work Index Design

### Purpose

The main page should reveal the collective’s work immediately. It is the actual heart of the site.

### Main Layout

The page should have:
- fixed site name at top left: Daniel Oyegade
- fixed right navigation item: INFORMATION
- large scrolling field of projects beneath
- generous margins and white space
- editorial asymmetry within a disciplined grid system

### Header Behaviour

The header should remain fixed or visually stable while the user scrolls.

#### Left side
- Daniel Oyegade
- upper-left corner
- small, restrained, consistently positioned

#### Right side
- INFORMATION
- upper-right corner
- same typographic treatment as left-side nav

Do not add extra nav items in v1 unless necessary.

### Work Layout Style

The layout should be freeform, but not random.

That means:
- projects sit on a hidden grid
- image sizes vary
- layouts feel editorial and asymmetrical
- spacing remains controlled
- the page breathes

The page should not become a simple masonry wall with no rhythm.

### Layout Rules

- use a hidden column structure beneath the freeform layout
- vary widths and heights intentionally
- allow portrait and landscape crops
- repeat layout motifs sparingly
- introduce white space breaks to reset rhythm
- keep the composition calm

### Recommended Project Image Ratios

Use a controlled set of image ratios rather than a unique ratio for every project.

Suggested ratios:
- portrait
- landscape
- wide landscape
- occasional large hero-format image

### Hover Behaviour

The strongest approved hover behaviour is:
- image remains mostly stable
- project title fades in
- one-line descriptor or discipline line appears beneath
- image may darken by 3–8% at most
- avoid scale shift if possible

Do not use:
- dramatic overlays
- sliding panels
- blur-heavy transitions
- zoom gimmicks
- animated boxes
- oversized cursor effects

### Hover Text Placement

Hover text appears:
- bottom left
- over the image
- very restrained

### Hover Text Structure

Each hovered project shows:
1. Project title
2. One-line descriptor beneath

Example:
- Before the Night Is Spent
- Short film / nocturnal city study

### Hover Text Styling

The title should be:
- clear
- confident
- medium-sized
- clean

The descriptor should be:
- smaller
- understated
- visually secondary

### Readability Rules

If hover text needs support over bright or complex imagery, use one of the following only:
- very slight image dim on hover
- subtle dark gradient at the lower edge
- minimal text shadow if necessary

Do not use heavy opaque text boxes unless all other options fail.

## Information Page Design

### Purpose

A minimal supporting page that tells the viewer who the collective is without breaking the visual world.

### Tone

The Information page should be:
- concise
- clear
- restrained
- not overloaded with biography or manifesto text in v1

### Suggested Structure

1. Daniel Oyegade
2. Short collective statement
3. Team member names and roles
4. One concise paragraph about approach
5. Contact email
6. Optional links

### Example Structure

Daniel Oyegade is a creative collective working across image, moving image, direction, and strategy.

- Daniel Oyegade — Photographer, Writer, Director, Creative Director
- Fea — Creative Strategist
- Hope — Art Director, UX Designer, Photographer
- Dan — Director, Filmmaker
- Albert — Photographer, Business Analyst

Contact: hello@...

Keep the page spare.

## Project Pages (Recommended)

### Recommendation

Even for v1, simple dedicated project pages are recommended if time allows. They make the site feel complete and purposeful.

### Minimal Project Page Structure

Each project page can contain:
- project title
- one-line descriptor
- one or more large images
- optional credits or roles
- back link

### Style

Project pages should remain in the same design language:
- restrained
- image-led
- generous white space
- minimal copy

Do not turn them into long case studies unless needed later.

## Motion System

### General Motion Philosophy

Motion should feel:
- controlled
- understated
- deliberate
- premium through restraint

Motion should not feel:
- flashy
- playful
- tech-demo-like
- decorative for its own sake

### Approved Motion Moments

1. Intro floor label descent
2. Intro image swipe-up reveal
3. Project title hover fade-in
4. Optional minimal page fade for project pages

### Disallowed or Discouraged Motion

- parallax-heavy sections
- oversized cursor systems
- floating UI elements
- exaggerated page transitions
- scroll-jacking
- continuous ambient motion

## Spacing and Composition Rules

### Spatial Intent

The site should feel expensive through proportion.

That means:
- generous outer margins
- controlled gaps between projects
- no cluttered stacking
- clear top padding beneath fixed nav
- deliberate visual pauses

### Composition Notes

The work page should resemble:
- an exhibition wall
- a contact sheet with hierarchy
- a composed editorial spread

Not:
- a random collage
- a Pinterest grid
- a dense portfolio dump

### Text Proportion

Text should often feel slightly smaller than expected. This usually reads as more premium than oversized statement typography everywhere.

## Image Handling and Asset Prep

### Image Philosophy

The imagery is the actual proof of the collective. The design exists to frame it.

### Image Treatment

- images should be high quality
- crops should feel intentional
- avoid forcing everything into one uniform ratio
- use a limited system of ratios
- preserve strong compositions

### Asset Naming for Easy VS Code Use

To keep the first build simple, use direct, predictable file names.

#### Intro image
- `intro-image.jpg`

#### Project covers
- `project-1.jpg`
- `project-2.jpg`
- `project-3.jpg`
- `project-4.jpg`
- `project-5.jpg`
- `project-6.jpg`
- `project-7.jpg`
- `project-8.jpg`
- `project-9.jpg`
- `project-10.jpg`

If a project has additional images:
- `project-1-detail-1.jpg`
- `project-1-detail-2.jpg`
- `project-2-detail-1.jpg`

Keep file names lowercase and hyphenated.

### Recommended Folder Structure for Assets

```text
/public
  /images
    intro-image.jpg
    project-1.jpg
    project-2.jpg
    project-3.jpg
    project-4.jpg
    project-5.jpg
    project-6.jpg
    project-7.jpg
    project-8.jpg
    project-9.jpg
    project-10.jpg
```

If detail images are used:

```text
/public
  /images
    /projects
      project-1.jpg
      project-1-detail-1.jpg
      project-1-detail-2.jpg
      project-2.jpg
      project-2-detail-1.jpg
```

### Image Checklist

For each project, prepare:
- 1 main cover image
- optional short descriptor
- optional additional detail images
- optional year / role / medium

## Content Model

### Project Card Fields

Each project should eventually have the following fields, even if placeholders are used at first:
- title
- slug
- cover image
- descriptor
- year
- roles
- category
- optional detail images

### Placeholder Content System

For v1, placeholder entries may be structured like this:

#### Project 1
- title: Project 1
- descriptor: Short descriptor here
- image: project-1.jpg

#### Project 2
- title: Project 2
- descriptor: Short descriptor here
- image: project-2.jpg

And so on.

This allows you to build the full structure before the final copy is written.

### Suggested Placeholder Project List

- Project 1
- Project 2
- Project 3
- Project 4
- Project 5
- Project 6
- Project 7
- Project 8
- Project 9
- Project 10

## Recommended Folder and File Organisation

The repo should be structured clearly so images and content are easy to replace.

### Recommended Project Structure

```text
daniel-oyegade/
  public/
    images/
      intro-image.jpg
      project-1.jpg
      project-2.jpg
      project-3.jpg
      project-4.jpg
      project-5.jpg
      project-6.jpg
      project-7.jpg
      project-8.jpg
      project-9.jpg
      project-10.jpg
  src/
    components/
      IntroOverlay.astro
      FixedHeader.astro
      ProjectCard.astro
      ProjectGrid.astro
    content/
      projects/
        project-1.json
        project-2.json
        project-3.json
        project-4.json
    layouts/
      BaseLayout.astro
    pages/
      index.astro
      information.astro
      work/
        [slug].astro
    styles/
      global.css
  docs/
    design-document.md
    copy-notes.md
    asset-list.md
```

This structure allows:
- easy swapping of images
- clean project data management
- simple scaling later

## Codex Build Brief

Use the following as the build brief for Codex.

### Codex Brief

Build a premium, minimal portfolio site for a creative collective called Daniel Oyegade.

Use Astro, TypeScript, and Tailwind CSS.

The site must open with a full-screen intro image named `intro-image.jpg`. Over this image, display a descending sequence of floor labels in uppercase: EIGHTH FLOOR, FOURTH FLOOR, FIRST FLOOR, GROUND FLOOR, Daniel Oyegade.

Each label should appear lower on the screen than the previous one. The labels should replace one another, not stack visibly. The motion should be restrained, cool, architectural, and minimal. After holding slightly on Daniel Oyegade, the intro image should swipe upward as a single clean plane and reveal the homepage beneath.

The homepage should be a white or off-white image-led work index. Keep a fixed navigation with Daniel Oyegade on the top left and INFORMATION on the top right.

The project layout should feel editorial, asymmetrical, and freeform, but still sit on a hidden grid and remain visually disciplined. Each project should use a simple image file such as `project-1.jpg`, `project-2.jpg`, and so on. On hover, a project should reveal text in the bottom left over the image. The hover treatment should be restrained: the image remains mostly stable, the title fades in, a short one-line descriptor appears beneath, and the image may darken slightly by roughly 3–8%. Avoid dramatic scale shifts or flashy overlays.

Typography should use a grotesk sans-serif plus one restrained serif. The site identity and navigation should be uppercase and restrained. Project titles should be medium-sized, clean, and confident. Descriptors should be short and understated. The intro floor labels should be larger than the nav, but smaller than large hero branding, and must feel inevitable rather than dramatic.

The site should feel like a gallery wall, a campaign contact sheet stripped to essentials, and a printed lookbook with digital motion. Avoid gimmicks, decorative UI, parallax-heavy effects, large cursor systems, and excessive animation.

Also create a minimal information page with a short collective description, team names and roles, and contact details.

Set up the file structure so that images can be easily replaced in VS Code.

## Build Priorities

### Phase 1

- establish intro sequence
- establish fixed header
- establish main project layout
- establish hover behaviour
- establish information page
- connect placeholder projects

### Phase 2

- add dedicated project pages
- refine spacing and layout rhythm
- replace placeholders with final project names and copy
- optimise assets

### Phase 3

- extend information page
- add filters if needed
- add more projects
- refine mobile behaviour further

## Mobile Behaviour Principles

Even though desktop is the main aesthetic focus, mobile should remain elegant.

### Mobile Rules

- intro still functions cleanly
- floor labels remain readable
- fixed nav remains simple and unobtrusive
- project layout becomes vertically stacked or simplified as needed
- hover information becomes tap-friendly
- project title and descriptor should always remain accessible on touch devices

Avoid overcomplicated mobile adaptations. Simplicity will help preserve the feel.

## Final Design Summary

Daniel Oyegade v1 should be:
- minimal
- severe in a calm way
- editorial
- image-first
- typographically controlled
- conceptually unified by descent and entry

It should open with an intro image and descending floor labels:
- EIGHTH FLOOR
- FOURTH FLOOR
- FIRST FLOOR
- GROUND FLOOR
- Daniel Oyegade

The intro then swipes away to reveal a scrolling work index with:
- Daniel Oyegade fixed top left
- INFORMATION fixed top right
- freeform project layout
- bottom-left hover titles over images
- one-line descriptors beneath titles
- restrained hover darkening

The typography system should use:
- a grotesk / sans-serif as the main system
- a restrained serif for selected editorial contrast

The overall feeling should be:
- a gallery wall
- a campaign contact sheet stripped to essentials
- a printed lookbook with digital motion

This is the complete v1 design direction and is stable enough to move into implementation.
