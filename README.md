# KOREAUSIMGUIDE - Frontend Prototype

## Project Overview
This is a frontend prototype for **KOREAUSIMGUIDE**, a service helping international travelers find the best SIM/eSIM plans in Korea. The project focuses on clarity, trust, and ease of use for a global audience.

## Tech Stack
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn/UI (Radix Primitives)
- **Routing:** Wouter (Lightweight router)
- **Icons:** Lucide React

## Directory Structure
```
client/src/
├── components/
│   ├── layout/          # Global layout (Header/Footer)
│   │   └── Layout.tsx
│   └── ui/              # Shadcn UI components (Button, Card, etc.)
├── pages/
│   ├── home.tsx         # Landing page
│   ├── compare.tsx      # SIM plan comparison page
│   ├── tips.tsx         # Tips list page
│   └── tip-detail.tsx   # Article detail page
├── lib/                 # Utilities (cn, queryClient)
├── App.tsx              # Main router configuration
└── index.css            # Tailwind setup and global variables
```

## Key Features
1.  **Multi-language Support (UI Only):** Language selector in header (mocked).
2.  **Plan Comparison:** Grid layout for comparing telecom plans.
3.  **Content Hub:** Blog-style tips section with detail views.
4.  **Responsive Design:** Fully mobile-optimized with a hamburger menu.

## Development Notes
- **Routing:** Uses `wouter`. Routes are defined in `App.tsx`.
- **Images:** Currently using generated assets in `attached_assets/`.
- **Data:** Data is currently mocked within the page components. For production, move this to a separate data file or API.

## Getting Started
1.  Run `npm install`
2.  Run `npm run dev` to start the development server.
