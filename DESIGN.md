---
name: Prem Vida Admin
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#adc6ff'
  on-tertiary: '#002e6a'
  tertiary-container: '#71a1ff'
  on-tertiary-container: '#00367a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 2rem
  gutter: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
  sidebar-width: 280px
---

## Brand & Style

The design system is engineered for a premium, high-stakes administrative environment. It adopts a **Glassmorphic** aesthetic inspired by modern desktop operating systems, prioritizing depth, clarity, and visual prestige. The target audience consists of high-level administrators who require a focused, "dark mode" workspace that reduces eye strain while conveying a sense of luxury and technical sophistication.

The UI evokes a sense of "precision-crafted glass." Every layer is intentional, utilizing heavy backdrop blurs and reflective light-piping on borders to simulate physical depth. The atmosphere is calm yet authoritative, utilizing a "Deep Dark Zinc" foundation to make data and interactive elements vibrate with clarity.

## Colors

This design system uses a strictly controlled dark palette to maintain its premium glass effect. 

- **Base Background:** Deep Dark Zinc (#09090b).
- **Primary (Emerald):** Used for success states, completed actions, and "Paid" statuses. It represents growth and resolution.
- **Secondary (Amber):** Used for "Pending" or "Warning" states, requiring user attention without immediate urgency.
- **Tertiary (Blue):** Used for "Requested" or "Information" states, representing active processes.
- **Neutral:** Shades of Zinc and Slate are used for text and iconography to maintain a monochromatic, high-end feel.

Transparency is a functional color here; background surfaces must always utilize a 40% opacity coupled with a 40px backdrop blur to ensure legibility over varying background elements.

## Typography

The typography is systematic and functional, utilizing **Inter** for its neutral, highly legible characteristics across digital screens. 

- **Headings:** High contrast is achieved through bold weights and tighter letter spacing for a "tight" editorial feel.
- **Metadata/Labels:** Use the `label-md` style, which is slightly tracked out and uppercase to distinguish it from body content.
- **Coloration:** Primary text uses white at 90-100% opacity, while secondary/metadata text drops to 50-60% opacity to establish hierarchy without introducing new hues.

## Layout & Spacing

This design system employs a **Fluid Grid** with a structured sidebar-and-stage model. 

- **Sidebar:** Fixed at 280px, utilizing a more opaque glass effect to anchor the navigation.
- **The Stage:** A fluid content area with a minimum 32px (2rem) padding on all sides.
- **Grid:** Elements should follow a 12-column logic for desktop layouts.
- **Responsive Behavior:** On tablet, the sidebar collapses into a floating icon bar. On mobile, the layout reflows into a single column with the "Floating Action Button" (FAB) becoming the primary navigation trigger.

## Elevation & Depth

Depth is the defining characteristic of this system. It is achieved through a three-tier elevation model:

1.  **Level 0 (Base):** Deep Dark Zinc (#09090b).
2.  **Level 1 (Cards/Panels):** Surface at 40% opacity with a 40px backdrop blur. 
    - **Top Border:** 1px white at 20% opacity (mimicking a light source from above).
    - **Left Border:** 1px white at 10% opacity.
    - **Shadows:** Massive, soft black shadows with 0px offset and 30px-50px blur to create a "floating" effect.
3.  **Level 2 (Popovers/Modals):** Surface at 60% opacity. Borders are more pronounced to differentiate the modal from the background cards.

All glass elements must use `backdrop-filter: blur(24px) saturate(180%)` to ensure colors behind the glass feel vibrant but diffused.

## Shapes

The design system uses **Rounded (0.5rem)** as the base radius. This creates a modern, friendly but professional feel that mimics high-end hardware.

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px).
- **Cards & Large Containers:** 1rem (16px) using `rounded-lg`.
- **Thumbnails/Avatars:** 1.5rem (24px) or fully circular for users.

## Components

### Buttons
- **Primary:** Solid Emerald (#10b981) with white text. No glass effect to ensure it is the clearest call to action.
- **Secondary:** Glass-based with a white/10 border and white text.
- **FAB:** A circular, oversized button with a heavy shadow and primary gradient.

### Glass Cards
Every card must have a subtle inner glow. Use a box-shadow with `inset 0 1px 0 0 rgba(255,255,255,0.1)`.

### Tables
- **Rows:** Transparent by default, changing to a 10% white tint on hover.
- **Thumbnails:** Rounded corners with a 1px white/20 border to prevent them from bleeding into the dark background.
- **Status Chips:** Small, pill-shaped backgrounds with high-saturation text (e.g., Emerald text on a 10% Emerald background).

### Input Fields
Inputs should be dark and recessed. Use a 20% white background with an inner shadow to simulate depth, switching to a primary Emerald border on focus.

### Toggles
The "Track" should be a dark glass, and the "Thumb" should be a crisp, solid white or Emerald circle, creating a high-contrast physical switch metaphor.