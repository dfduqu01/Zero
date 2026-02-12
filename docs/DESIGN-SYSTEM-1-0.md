# Zyro Design System 1.0

**Version:** 1.0
**Last Updated:** 2026-02-08
**Status:** Active - Deployed to Production

---

## Overview

This design system documents the visual language, components, and patterns used in the Zyro Online e-commerce platform. The system follows a minimalist, monochromatic approach with black and white as primary colors, ensuring a clean and premium feel for an optical e-commerce experience.

---

## 1. Color Palette

### Primary Colors (CSS Variables)

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | `0 0% 100%` | `#FFFFFF` | Page backgrounds |
| `--foreground` | `0 0% 3.9%` | `#0A0A0A` | Primary text, icons, buttons |
| `--primary` | `0 0% 9%` | `#171717` | Primary buttons, emphasis |
| `--primary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on primary backgrounds |

### Secondary & Muted Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--secondary` | `0 0% 96.1%` | `#F5F5F5` | Secondary buttons |
| `--secondary-foreground` | `0 0% 9%` | `#171717` | Text on secondary |
| `--muted` | `0 0% 96.1%` | `#F5F5F5` | Muted backgrounds, sections |
| `--muted-foreground` | `0 0% 45.1%` | `#737373` | Secondary text, descriptions |

### Utility Colors

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--border` | `0 0% 89.8%` | `#E5E5E5` | Borders, dividers |
| `--input` | `0 0% 89.8%` | `#E5E5E5` | Input borders |
| `--ring` | `0 0% 3.9%` | `#0A0A0A` | Focus rings |
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | Error states |

### Accent Colors (Specific Use Cases)

| Color | Hex | Usage |
|-------|-----|-------|
| Gold/Amber | `#F59E0B` | Star ratings in testimonials |
| Black | `#000000` | Badges, CTAs, icons |
| White | `#FFFFFF` | Text on dark backgrounds |

---

## 2. Typography

### Font Family
- **Primary:** System font stack (inherited from Tailwind)
- **Fallback:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Heading Sizes

| Element | Class | Size (Desktop) | Weight |
|---------|-------|----------------|--------|
| H1 (Hero) | `text-4xl sm:text-5xl md:text-6xl xl:text-6xl 2xl:text-7xl` | 36px → 72px | `font-extrabold` |
| H2 (Section) | `text-3xl md:text-4xl` | 30px → 36px | `font-bold` |
| H3 (Card Title) | `text-xl` | 20px | `font-semibold` |
| Body | `text-base` | 16px | `font-normal` |
| Small | `text-sm` | 14px | `font-medium` |
| Caption | `text-xs` | 12px | `font-medium` |

### Text Colors

| Type | Class | Usage |
|------|-------|-------|
| Primary | `text-foreground` | Headings, important text |
| Secondary | `text-muted-foreground` | Descriptions, body text |
| On Dark | `text-background` | Text on dark backgrounds |
| Hover State | `hover:text-foreground/80` | Navigation links |

---

## 3. Buttons

### Primary Button (Default)
```jsx
<Button
  size="lg"
  className="text-base px-8 py-6 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
>
  Explorar Colección
  <ArrowRight className="w-5 h-5 ml-2" />
</Button>
```

**Styles:**
- Background: `bg-primary` (black)
- Text: `text-primary-foreground` (white)
- Border Radius: `rounded-full`
- Padding: `px-8 py-6`
- Shadow: `shadow-lg` → `hover:shadow-xl`
- Hover: `hover:scale-105`
- Transition: `transition-all duration-300`

### Secondary/Outline Button
```jsx
<Button
  size="lg"
  variant="outline"
  className="text-base px-8 py-6 rounded-full font-bold border-2 hover:bg-muted transition-all duration-300"
>
  Cómo Funciona
</Button>
```

**Styles:**
- Background: `bg-transparent`
- Border: `border-2`
- Text: `text-foreground`
- Hover: `hover:bg-muted`

### Ghost Button
```jsx
<Button variant="ghost">
  Mi Perfil
</Button>
```

**Usage:** Navigation, secondary actions

### Inverted Button (On Dark Backgrounds)
```jsx
<Button
  size="lg"
  variant="secondary"
  className="px-8 py-6 rounded-full font-bold hover:scale-105 transition-all duration-300"
>
  Explorar Colección
</Button>
```

---

## 4. Cards

### Product Card
```jsx
<Card className="overflow-hidden border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
  <div className="relative aspect-square overflow-hidden bg-muted">
    <Image ... className="object-cover group-hover:scale-110 transition-transform duration-700" />

    {/* Hover Overlay */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

    {/* Quick View Button */}
    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
      <div className="bg-white text-foreground text-sm font-semibold py-2.5 px-4 rounded-full text-center shadow-lg">
        Ver Detalles
      </div>
    </div>
  </div>

  <CardContent className="p-4">
    <p className="text-sm text-muted-foreground mb-1">{brand}</p>
    <h3 className="font-semibold mb-2 line-clamp-1">{name}</h3>
    <p className="text-2xl font-bold">${price}</p>
  </CardContent>
</Card>
```

**Hover Effects:**
- Border: `hover:border-foreground/20`
- Shadow: `hover:shadow-xl`
- Scale: `hover:scale-[1.02]`
- Image Zoom: `group-hover:scale-110`
- Overlay: `group-hover:bg-black/10`
- Quick View Slide Up: `translate-y-4 group-hover:translate-y-0`

### Feature Card
```jsx
<Card className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
  <CardContent className="pt-8 pb-6 text-center space-y-4">
    <div className="mx-auto w-14 h-14 rounded-full bg-foreground flex items-center justify-center">
      <Icon className="h-7 w-7 text-background" />
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </CardContent>
</Card>
```

**Icon Container:**
- Size: `w-14 h-14`
- Shape: `rounded-full`
- Background: `bg-foreground` (black)
- Icon Color: `text-background` (white)

### Testimonial Card
```jsx
<Card className="border-2 hover:border-foreground/20 hover:shadow-xl transition-all duration-500">
  <CardContent className="p-8">
    {/* Gold Stars */}
    <div className="flex gap-1 mb-4">
      <Star className="w-5 h-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
    </div>
    <p className="text-muted-foreground mb-6 leading-relaxed">"{text}"</p>
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground text-sm">{location}</p>
    </div>
  </CardContent>
</Card>
```

---

## 5. Badges

### Section Badge (Black Pill)
```jsx
<span className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-semibold mb-4">
  COLECCIÓN DESTACADA
</span>
```

**Styles:**
- Background: `bg-foreground` (black)
- Text: `text-background` (white)
- Border Radius: `rounded-full`
- Text Transform: Uppercase
- Font: `text-sm font-semibold`

### Hero Badge (Muted with Border)
```jsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
  <Zap className="w-4 h-4 text-foreground" />
  <span className="text-sm font-medium">25+ años de experiencia</span>
</div>
```

### Product Badge (Low Stock)
```jsx
<Badge className="absolute top-3 right-3 bg-black text-white">
  Pocas Unidades
</Badge>
```

---

## 6. Icons

### Icon Library
- **Source:** Lucide React
- **Size Standards:**
  - Small: `w-4 h-4` (badges, inline)
  - Medium: `w-5 h-5` (buttons, lists)
  - Large: `w-7 h-7` (feature cards)
  - XL: `w-16 h-16` (placeholders)

### Icon Colors

| Context | Class |
|---------|-------|
| On Light Background | `text-foreground` |
| On Dark Background | `text-background` |
| Muted/Placeholder | `text-muted-foreground/20` |
| In Buttons | Inherits button text color |

### Common Icons Used

| Icon | Import | Usage |
|------|--------|-------|
| `Zap` | lucide-react | Experience badge |
| `Shield` | lucide-react | Quality/guarantee |
| `Clock` | lucide-react | Years of experience |
| `MessageCircle` | lucide-react | Support/WhatsApp |
| `Star` | lucide-react | Ratings |
| `CheckCircle2` | lucide-react | Trust badges |
| `ArrowRight` | lucide-react | CTAs |
| `Eye` | lucide-react | Image placeholder |

---

## 7. Spacing & Layout

### Container
```jsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
```

### Section Padding
| Size | Class | Usage |
|------|-------|-------|
| Standard | `py-24` | Most sections |
| Hero | `py-16 md:py-24 lg:py-32` | Hero section |
| Footer | `py-16` | Footer |

### Grid Layouts

**Products Grid:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Features Grid:**
```jsx
<div className="grid md:grid-cols-3 gap-8">
```

**Footer Grid:**
```jsx
<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
```

---

## 8. Shadows & Effects

### Shadow Levels

| Level | Class | Usage |
|-------|-------|-------|
| Small | `shadow-sm` | Cards at rest |
| Large | `shadow-lg` | Buttons |
| XL | `shadow-xl` | Cards on hover |
| 2XL | `shadow-2xl` | Hero image |

### Transitions

| Duration | Class | Usage |
|----------|-------|-------|
| Fast | `duration-300` | Buttons, links |
| Medium | `duration-500` | Cards |
| Slow | `duration-700` | Image zoom |

### Standard Transition
```jsx
className="transition-all duration-300"
```

---

## 9. Section Backgrounds

| Type | Class | Usage |
|------|-------|-------|
| White | `bg-white` | Default |
| Muted | `bg-muted/30` | Alternating sections |
| Dark | `bg-foreground text-background` | CTA section |

---

## 10. Header

### Structure
```jsx
<header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
    {/* Logo | Nav | Actions */}
  </div>
</header>
```

**Features:**
- Sticky positioning: `sticky top-0`
- Z-index: `z-50`
- Glassmorphism: `bg-white/95 backdrop-blur`
- Height: `h-16` (64px)

### Navigation Links
```jsx
<Link className="text-sm font-medium transition-colors hover:text-foreground/80">
```

---

## 11. Footer

### Structure
```jsx
<footer className="border-t bg-muted/30 py-16">
  <div className="container mx-auto">
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      {/* Columns */}
    </div>
    <div className="border-t pt-8 text-center text-sm text-muted-foreground">
      {/* Copyright */}
    </div>
  </div>
</footer>
```

---

## 12. Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

---

## 13. Component Library

Components are built on **shadcn/ui** with custom styling:

- `Button` - @/components/ui/button
- `Card`, `CardContent` - @/components/ui/card
- `Badge` - @/components/ui/badge

---

## 14. Implementation Notes

### Do's
- Use `rounded-full` for all CTAs and badges
- Apply hover scale effects (`hover:scale-[1.02]` or `hover:scale-105`)
- Use `transition-all duration-300` for smooth animations
- Maintain black/white color scheme for brand consistency
- Use gold (`#f59e0b`) only for star ratings

### Don'ts
- Don't use colored gradients or accent colors
- Don't skip hover states on interactive elements
- Don't use shadows lighter than `shadow-lg` on buttons
- Don't break the monochromatic palette

---

## Changelog

### Version 1.0 (2026-02-08)
- Initial design system based on landing page redesign
- Documented colors, typography, components
- Established button, card, and badge patterns
- Defined spacing and layout guidelines
