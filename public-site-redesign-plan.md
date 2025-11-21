# Public Site Single-Page Redesign Plan (Using Brutal Theme)

## Overview

This document outlines the plan to redesign StoryMode's public-facing website as a single-page application using the brutal-main Astro template's neobrutalism design system. The redesign consolidates content from multiple pages (about, contact, blog, works) into a cohesive single-page experience.

## Current State Analysis

### Existing Public Pages
- **index.astro**: Hero section with company intro, services list, contact CTA, DB test button
- **about.astro**: Company story, mission, and 5-step process
- **contact.astro**: Contact form and company details
- **blog.astro**: Blog post listings with excerpts
- **works.astro**: Portfolio showcase with work samples
- **sounds.astro**: Authenticated sound library (excluded from redesign)

### Brutal Theme Analysis

The `brutal-main` Astro template provides:
- **Styling**: UnoCSS with pink backgrounds, large typography, and bold colors
- **Components**: Card, Button, Pill from @eliancodes/brutal-ui
- **Layout**: Grid-based with responsive columns (md:grid-cols-8)
- **Fonts**: Outfit, DM Serif, Poppins, Sanchez, Righteous
- **Structure**: Single-page with sections and recent blog posts

## Proposed Single-Page Structure

```
┌─────────────────────────────────────┐
│ Header/Navigation (Brutal Style)    │
├─────────────────────────────────────┤
│ Hero Section (Grid: 8 cols)         │
│ - Main headline (col-span-4)        │
│ - Services/Logo (col-span-2)        │
│ - Contact CTA (col-span-2)          │
├─────────────────────────────────────┤
│ Services Section (Full width)       │
├─────────────────────────────────────┤
│ About Section (Grid: 8 cols)        │
│ - Story (col-span-4)                │
│ - Process (col-span-2)              │
│ - Team/Stats (col-span-2)           │
├─────────────────────────────────────┤
│ Works Section (Portfolio cards)     │
├─────────────────────────────────────┤
│ Blog Section (Recent posts)         │
├─────────────────────────────────────┤
│ Contact Section (Form + info)       │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

## Content Integration Strategy

### 1. Hero Section (adapted from index.astro)
- **Layout**: 8-column grid matching brutal theme
- **Content**:
  - Col 1-4: Main headline "Story Mode is a fun UX sound design studio"
  - Col 5-6: Services list in brutal Card component
  - Col 7-8: Contact CTA with brutal Button
- **Brutal Elements**: Large outfit typography, pink background, Card components

### 2. Services Section (enhanced from index.astro)
- **Layout**: Full-width section with brutal Cards
- **Content**: Transform bullet services into visual service cards
- **Brutal Elements**: Pill components for service tags, Card containers

### 3. About Section (from about.astro)
- **Layout**: 8-column grid
- **Content**:
  - Col 1-4: Company story in Card
  - Col 5-6: Process steps with brutal styling
  - Col 7-8: Team info or key stats
- **Brutal Elements**: DM Serif headings, large typography

### 4. Works Section (from works.astro)
- **Layout**: Grid of brutal Cards
- **Content**: Portfolio items as Card components
- **Brutal Elements**: Hover effects, brutal Button CTAs

### 5. Blog Section (from blog.astro)
- **Layout**: Recent posts using brutal theme's blog components
- **Content**: Blog previews with brutal styling
- **Brutal Elements**: Card-based post summaries

### 6. Contact Section (from contact.astro)
- **Layout**: Grid with form and info
- **Content**: Contact form in brutal Card, contact details
- **Brutal Elements**: Button styling, form validation

## Component Modifications Required

### New Components (Brutal Theme Integration)
1. **BrutalNavigation**: Fixed header with brutal styling
2. **BrutalHero**: Hero section with 8-column grid
3. **BrutalServiceCard**: Service cards with Pill tags
4. **BrutalProcessStep**: Process visualization
5. **BrutalWorkCard**: Portfolio cards with brutal effects
6. **BrutalBlogPreview**: Blog post previews
7. **BrutalContactForm**: Contact form with brutal styling

### Existing Components to Adapt
1. **ContactForm.astro**: Update to use brutal Card and Button
2. **WorkCard.astro**: Add brutal hover effects and styling
3. **BlogPost.astro**: Adapt to brutal Card format

### Layout Updates
- **Layout.astro**: Update to use brutal theme fonts and colors
- **BaseNavigation.astro**: Convert to brutal style navigation

## Technical Implementation Approach

### Styling Migration
- **Replace Tailwind with UnoCSS**: Update build configuration
- **Adopt Brutal Color Scheme**: Pink backgrounds, bold colors
- **Implement Brutal Typography**: Outfit, DM Serif font stack
- **Add Brutal Components**: Import @eliancodes/brutal-ui

### File Structure Changes
```
src/
├── layouts/
│   └── BrutalLayout.astro (adapted from brutal-main)
├── components/
│   ├── brutal/
│   │   ├── BrutalNavigation.astro
│   │   ├── BrutalHero.astro
│   │   ├── BrutalServiceCard.astro
│   │   ├── BrutalWorkCard.astro
│   │   └── BrutalContactForm.astro
│   └── ui/ (existing components updated)
├── pages/
│   ├── index.astro (redesigned as single brutal page)
│   ├── about.astro (deprecated)
│   ├── contact.astro (deprecated)
│   ├── blog.astro (deprecated)
│   └── works.astro (deprecated)
└── styles/
    └── brutal.css (UnoCSS configuration)
```

### Content Migration Strategy
1. **Extract Content**: Pull text/content from existing pages
2. **Adapt Structure**: Reorganize into brutal grid layout
3. **Apply Styling**: Convert to brutal Card/Button/Pill components
4. **Test Responsiveness**: Ensure mobile compatibility

### Navigation Implementation
- **Fixed Header**: Brutal-styled navigation bar
- **Smooth Scrolling**: Anchor links with brutal Button styling
- **Mobile Menu**: Brutal mobile navigation
- **Active Indicators**: Visual feedback for current section

## Implementation Phases

### Phase 1: Theme Setup
- Install UnoCSS and @eliancodes/brutal-ui
- Configure brutal theme fonts and colors
- Create brutal layout component
- Set up brutal navigation

### Phase 2: Component Development
- Build brutal section components
- Adapt existing components to brutal style
- Create brutal Card-based layouts
- Implement brutal Button and Pill usage

### Phase 3: Content Integration
- Migrate hero content to brutal grid
- Convert services to brutal Cards
- Adapt about section to brutal layout
- Transform works into brutal portfolio

### Phase 4: Navigation & Polish
- Implement smooth scrolling navigation
- Add brutal contact form
- Integrate blog section
- Test and refine responsive design

## SEO & Performance Considerations

### SEO Strategy
- Maintain proper heading hierarchy (H1 once, H2 for sections)
- Use semantic HTML with brutal Card components
- Preserve meta tags and structured data
- Ensure accessibility with brutal design

### Performance Optimizations
- UnoCSS for efficient styling
- Lazy load images in portfolio/blog sections
- Optimize brutal component bundle size
- Maintain Astro's static generation benefits

## Accessibility Improvements

### Brutal Theme Accessibility
- Ensure sufficient color contrast with pink backgrounds
- Maintain keyboard navigation in brutal components
- Add proper ARIA labels for brutal Cards
- Test screen reader compatibility

### Content Accessibility
- Preserve heading structure in brutal layout
- Maintain alt text for images
- Ensure form accessibility in brutal ContactForm
- Add focus indicators for brutal Buttons

## Migration Strategy

### Phase 1: Component Development
- Create new section components
- Test individual sections
- Implement navigation system

### Phase 2: Content Integration
- Move content from existing pages to new components
- Update data structures for dynamic content
- Implement section anchors

### Phase 3: Navigation & UX
- Implement smooth scrolling
- Add active section detection
- Test mobile responsiveness

### Phase 4: Cleanup & Redirects
- Remove deprecated page files
- Add redirects from old URLs to new single page with anchors
- Update sitemap and meta tags

## Testing Strategy

### Functionality Testing
- Navigation link accuracy
- Smooth scrolling behavior
- Form submission functionality
- Mobile menu operation

### Performance Testing
- Page load times
- Smooth scrolling performance
- Image loading optimization
- Bundle size verification

### Cross-browser Testing
- Modern browser compatibility
- Mobile browser testing
- Accessibility tool validation

---

*This plan leverages the brutal theme's distinctive neobrutalism aesthetic while maintaining StoryMode's content and functionality, creating a bold, modern single-page experience that stands out from typical portfolio sites.*