# Project Context for AI Assistants (Cursor / Claude Code)

## Product Vision
**KOREAUSIMGUIDE** is a guide for foreign travelers visiting Korea, helping them choose the best SIM/eSIM plans. The design should be "Global Friendly" - clean, trustworthy, and accessible.

## Design System
- **Typography:**
  - Headings: `Outfit` (Modern, friendly)
  - Body: `Inter` (Clean, legible)
- **Color Palette:**
  - Primary: International Blue (`hsl(221 83% 53%)`)
  - Background: Clean White / Light Gray
- **Visual Style:**
  - Soft shadows (`shadow-lg`)
  - Rounded corners (`rounded-2xl`, `rounded-3xl`)
  - Backdrop blur effects for floating elements

## Current Status
- **Frontend Only:** No backend integration yet.
- **Mock Data:** All plan details and articles are hardcoded in the components.

## Next Steps for Development
1.  **Data Separation:** Move hardcoded data (plans, tips) into separate JSON files or a state management store.
2.  **SEO Optimization:** Enhance `Helmet` or meta tags for individual pages.
3.  **CMS Integration:** Connect to a headless CMS for the Tips section.
4.  **Internationalization (i18n):** Implement `react-i18next` to make the language selector functional.

## Component Guidelines
- Use `Layout.tsx` for all new pages to ensure consistent Header/Footer.
- Use `shadcn/ui` components from `components/ui/` whenever possible.
- Tailwind v4 is used - check `index.css` for CSS variables.
