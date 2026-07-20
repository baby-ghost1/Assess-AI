# Design System

## Theme

Modern SaaS aesthetic inspired by:
- Linear
- Stripe Dashboard
- Clerk
- Vercel
- OpenAI
- Notion
- LeetCode

## Colors

### Primary
```css
--primary: #4F46E5;        /* Indigo-600 */
--primary-light: #6366F1;  /* Indigo-500 */
--primary-dark: #4338CA;   /* Indigo-700 */
```

### Accent
```css
--accent: #06B6D4;         /* Cyan-500 */
--accent-light: #22D3EE;   /* Cyan-400 */
--accent-dark: #0891B2;    /* Cyan-600 */
```

### Semantic

| Token | Color | Usage |
|-------|-------|-------|
| `--success` | `#22C55E` (Green-500) | Correct answers, passed |
| `--danger` | `#EF4444` (Red-500) | Wrong answers, violations |
| `--warning` | `#F59E0B` (Amber-500) | Warnings, partial |
| `--info` | `#3B82F6` (Blue-500) | Information |

### Backgrounds (Dark Mode)

```css
--bg-primary: #09090B;     /* Zinc-950 */
--bg-secondary: #18181B;   /* Zinc-900 */
--bg-tertiary: #27272A;    /* Zinc-800 */
--bg-card: #18181B;        /* Surface */
--bg-elevated: #27272A;
```

### Backgrounds (Light Mode)

```css
--bg-primary: #FFFFFF;
--bg-secondary: #FAFAFA;
--bg-tertiary: #F4F4F5;
--bg-card: #FFFFFF;
--bg-elevated: #FFFFFF;
```

### Text

```css
--text-primary: #FAFAFA;     /* Light mode: #09090B */
--text-secondary: #A1A1AA;   /* Light mode: #71717A */
--text-tertiary: #71717A;    /* Light mode: #A1A1AA */
--text-inverse: #09090B;     /* Light mode: #FAFAFA */
```

### Borders

```css
--border: #27272A;          /* Light mode: #E4E4E7 */
--border-light: #3F3F46;    /* Light mode: #F4F4F5 */
```

## Typography

| Font | Usage | Weight |
|------|-------|--------|
| Inter | Body, general text | 400, 500, 600 |
| Manrope | Headings, display | 600, 700, 800 |
| Geist | Monospace, code | 400, 500 |
| JetBrains Mono | Code editor | 400, 500 |

### Type Scale

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

## Spacing

8px Grid System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

## Shadows

```css
/* Soft shadows for glassmorphism cards */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Glassmorphism */
--glass-bg: rgba(24, 24, 27, 0.7);
--glass-border: rgba(255, 255, 255, 0.05);
--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
```

## Animations

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--easing: cubic-bezier(0.4, 0, 0.2, 1);
```

### Animation Patterns

- Page transitions: Fade + slight slide-up (250ms)
- Modal/Drawer: Slide from edge (300ms)
- Card hover: Slight elevation increase (200ms)
- Button: Scale on click (100ms)
- Skeleton loading: Pulse animation (1.5s loop)
- Toast: Slide from top-right (300ms)
- Tooltip: Fade in (150ms)

## Glassmorphism Card

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow);
}
```

## Component Variants

### Buttons

| Variant | Background | Hover | Usage |
|---------|------------|-------|-------|
| Primary | Primary | Primary-dark | Main actions |
| Secondary | Tertiary bg | Elevated bg | Secondary actions |
| Ghost | Transparent | Tertiary bg | Subtle actions |
| Danger | Danger | Darker red | Destructive actions |
| Outline | Transparent | With border | Outline style |

### Inputs

- Background: bg-secondary
- Border: border
- Focus ring: primary (2px, offset 2px)
- Error border: danger
- Placeholder: text-tertiary
- Disabled: 50% opacity

### Cards

- Background: bg-card (light mode: #FFFFFF)
- Border: border (light mode: #E4E4E7)
- Border radius: radius-xl (16px)
- Shadow: shadow-sm on default, shadow-md on hover
- Padding: space-6 (24px)

### Sidebar

- Width: 280px (collapsed: 72px)
- Background: bg-secondary
- Border-right: border
- Active item: primary bg with 10% opacity

### Topbar

- Height: 64px
- Background: bg-card / glass
- Border-bottom: border

## Responsive Breakpoints

```css
--screen-sm: 640px;
--screen-md: 768px;
--screen-lg: 1024px;
--screen-xl: 1280px;
--screen-2xl: 1536px;
```

## Z-Index Scale

```css
--z-dropdown: 50;
--z-sticky: 100;
--z-modal-backdrop: 200;
--z-modal: 300;
--z-toast: 400;
--z-tooltip: 500;
```

## Icons

- Use Lucide Icons (via `lucide-react`) for all icons
- Consistent 20px default size
- Stroke width: 1.5px (configurable via prop)

## Loading States

- **Skeleton**: Animated placeholder with pulse effect
- **Spinner**: TailwindCSS animate-spin with primary color
- **Progress bar**: Linear with primary gradient (for assessments)
- **Skeleton card**: Matches card dimensions (height, border-radius)

## Dark Mode

- Default: Dark mode
- Toggle via theme switcher in topbar
- Persisted in localStorage
- CSS variables toggle via Tailwind `dark:` class
- All components must have light and dark variants
- Smooth transition between themes (500ms)
