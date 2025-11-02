# ZERO E-COMMERCE DESIGN SYSTEM

**Version**: 1.0
**Date**: November 2025
**Tech Stack**: Next.js + shadcn/ui + Tailwind CSS
**Language**: Spanish (Español)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components Library](#components-library)
6. [Landing Page Specifications](#landing-page-specifications)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Design Philosophy

### Brand Identity: ZERO

**Core Values:**
- **Cero intermediarios** - Direct connection, transparency
- **Cero complicaciones** - Simplicity, clarity, ease of use
- **Cero límites** - Freedom, possibilities, empowerment

**Visual Language:**
- **Modern & Clean** - Sophisticated, professional, trustworthy
- **Warm & Approachable** - Latin American heritage, human-centric
- **Premium yet Accessible** - Quality without pretension
- **Tech-forward** - Contemporary, digital-first

**Design Principles:**
1. **Clarity First** - Every element has a purpose, no clutter
2. **Human-Centered** - 25+ years of expertise meeting customer needs
3. **Visual Hierarchy** - Guide users naturally through experiences
4. **Consistency** - Predictable, learnable patterns
5. **Performance** - Fast, responsive, optimized

---

## Color Palette

### Primary Colors

**Deep Teal (Primary Brand Color)**
```css
--primary: 176 70% 32%           /* #197A6E - Main brand color */
--primary-hover: 176 70% 28%     /* #166658 - Hover state */
--primary-active: 176 70% 24%    /* #134D45 - Active/pressed */
--primary-foreground: 0 0% 100%  /* #FFFFFF - Text on primary */
```
**Reasoning**: Teal represents clarity, professionalism, and trust. It's calming yet confident, avoiding the overused purple while maintaining a modern, premium feel. Evokes optical precision and Latin American coastal heritage.

**Warm Terracotta (Accent Color)**
```css
--accent: 16 85% 58%             /* #E8734E - Warm accent */
--accent-hover: 16 85% 54%       /* #E25D3A - Hover state */
--accent-active: 16 85% 50%      /* #DC4726 - Active/pressed */
--accent-foreground: 0 0% 100%   /* #FFFFFF - Text on accent */
```
**Reasoning**: Warm terracotta adds energy, warmth, and a Latin American touch. Perfect for CTAs, highlights, and creating visual interest without being aggressive.

**Slate Gray (Secondary)**
```css
--secondary: 215 20% 65%         /* #95A5B8 - Muted secondary */
--secondary-hover: 215 20% 60%   /* #8797AC - Hover state */
--secondary-foreground: 215 25% 27% /* #364558 - Text on secondary */
```
**Reasoning**: Sophisticated gray with subtle blue undertone. Professional, versatile, complements primary colors.

### Neutral Colors

**Background & Surface Colors**
```css
--background: 0 0% 100%          /* #FFFFFF - Page background */
--foreground: 222 47% 11%        /* #0F172A - Primary text */

--card: 0 0% 100%                /* #FFFFFF - Card background */
--card-foreground: 222 47% 11%   /* #0F172A - Card text */

--popover: 0 0% 100%             /* #FFFFFF - Popover background */
--popover-foreground: 222 47% 11% /* #0F172A - Popover text */

--muted: 210 40% 96%             /* #F1F5F9 - Subtle backgrounds */
--muted-foreground: 215 16% 47%  /* #64748B - Secondary text */

--border: 214 32% 91%            /* #E2E8F0 - Borders */
--input: 214 32% 91%             /* #E2E8F0 - Input borders */
--ring: 176 70% 32%              /* #197A6E - Focus ring (matches primary) */
```

### Semantic Colors

**Success (Green)**
```css
--success: 142 76% 36%           /* #16A34A - Success states */
--success-foreground: 0 0% 100%  /* #FFFFFF */
```
Use for: Order delivered, payment successful, validation passed, in stock

**Warning (Amber)**
```css
--warning: 32 95% 44%            /* #F59E0B - Warning states */
--warning-foreground: 0 0% 100%  /* #FFFFFF */
```
Use for: Low stock, pending orders, attention needed

**Destructive (Red)**
```css
--destructive: 0 84% 60%         /* #EF4444 - Error/delete states */
--destructive-foreground: 0 0% 100% /* #FFFFFF */
```
Use for: Errors, delete actions, out of stock, cancelled orders

**Info (Blue)**
```css
--info: 199 89% 48%              /* #0EA5E9 - Informational */
--info-foreground: 0 0% 100%     /* #FFFFFF */
```
Use for: Informational messages, tips, help text

### Commerce-Specific Colors

**Price & Sales**
```css
--price-regular: 222 47% 11%     /* #0F172A - Regular price (foreground) */
--price-sale: 0 84% 60%          /* #EF4444 - Sale price (destructive red) */
--price-discount: 0 84% 60%      /* #EF4444 - Discount badge */
```

**Stock Status**
```css
--stock-in: 142 76% 36%          /* #16A34A - In stock (success) */
--stock-low: 32 95% 44%          /* #F59E0B - Low stock (warning) */
--stock-out: 0 84% 60%           /* #EF4444 - Out of stock (destructive) */
```

**Order Status Colors**
```css
--status-pending: 45 93% 47%     /* #F59E0B - Amber */
--status-processing: 217 91% 60% /* #3B82F6 - Blue */
--status-shipped: 262 83% 58%    /* #8B5CF6 - Purple (only for status) */
--status-delivered: 142 76% 36%  /* #16A34A - Green */
--status-cancelled: 0 84% 60%    /* #EF4444 - Red */
```
**Note**: Purple is used ONLY for "Shipped" status as it's a functional distinction, not a brand color.

---

## Typography

### Font Families

**Primary Font: Inter**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```
**Reasoning**: Clean, modern, highly legible, excellent for both headings and body text. Professional yet approachable. Supports Spanish characters perfectly.

**Monospace Font: JetBrains Mono** (for SKUs, codes, technical data)
```css
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Scale

| Size | rem | px | Usage |
|------|-----|----|----|
| `text-xs` | 0.75rem | 12px | Labels, captions, badge text |
| `text-sm` | 0.875rem | 14px | Secondary text, table data |
| `text-base` | 1rem | 16px | Body text (default) |
| `text-lg` | 1.125rem | 18px | Large body, card titles |
| `text-xl` | 1.25rem | 20px | Section headers |
| `text-2xl` | 1.5rem | 24px | Page titles, H2 |
| `text-3xl` | 1.875rem | 30px | Hero subheadings, H1 |
| `text-4xl` | 2.25rem | 36px | Landing page headers |
| `text-5xl` | 3rem | 48px | Hero headlines (mobile) |
| `text-6xl` | 3.75rem | 60px | Hero headlines (desktop) |
| `text-7xl` | 4.5rem | 72px | Extra large hero (optional) |

### Font Weights

```css
font-weight: 400  /* normal - Body text */
font-weight: 500  /* medium - Emphasis, links */
font-weight: 600  /* semibold - Subheadings, buttons */
font-weight: 700  /* bold - Headings, strong emphasis */
font-weight: 800  /* extrabold - Hero headlines (optional) */
```

### Line Heights

```css
line-height: 1.25  /* tight - Headings */
line-height: 1.5   /* normal - Body text */
line-height: 1.75  /* relaxed - Long-form content */
```

### Typography Examples

**Hero Headline (Landing Page)**
```
Font: Inter 800 (Extrabold)
Size: 72px (desktop) / 48px (mobile)
Line-height: 1.1
Color: --foreground (#0F172A)
Letter-spacing: -0.02em (tight)
```

**Subheading**
```
Font: Inter 600 (Semibold)
Size: 30px
Line-height: 1.3
Color: --muted-foreground (#64748B)
```

**Body Text**
```
Font: Inter 400 (Regular)
Size: 16px
Line-height: 1.5
Color: --foreground (#0F172A)
```

**Button Text**
```
Font: Inter 600 (Semibold)
Size: 16px
Letter-spacing: 0.01em
Color: --primary-foreground or --accent-foreground
```

---

## Spacing & Layout

### Spacing Scale (Tailwind Default + Custom)

```css
0:  0px      /* No space */
1:  4px      /* Micro spacing */
2:  8px      /* Tight spacing */
3:  12px     /* Small spacing */
4:  16px     /* Base spacing */
5:  20px     /* Medium spacing */
6:  24px     /* Large spacing */
8:  32px     /* Extra large spacing */
10: 40px     /* Section padding */
12: 48px     /* Large section spacing */
16: 64px     /* Hero spacing */
20: 80px     /* Extra large sections */
24: 96px     /* Landing page sections */
32: 128px    /* Massive spacing (rare) */
```

### Container Widths

```css
max-width: 1280px  /* xl - Main container */
max-width: 1024px  /* lg - Content container */
max-width: 768px   /* md - Form containers */
max-width: 640px   /* sm - Narrow content */
```

### Grid System

**Product Grid:**
- Mobile: 2 columns, gap-4 (16px)
- Tablet: 3 columns, gap-6 (24px)
- Desktop: 4 columns, gap-8 (32px)

**Landing Page Sections:**
- Padding: py-24 (96px desktop), py-16 (64px mobile)
- Max-width: max-w-7xl (1280px)
- Centered: mx-auto

### Border Radius

```css
rounded-none: 0px
rounded-sm:   2px   /* Subtle rounding */
rounded:      4px   /* Default buttons, inputs */
rounded-md:   6px   /* Cards */
rounded-lg:   8px   /* Larger cards, modals */
rounded-xl:   12px  /* Hero cards, featured elements */
rounded-2xl:  16px  /* Extra large cards */
rounded-full: 9999px /* Pills, avatars, circular badges */
```

### Shadows

```css
shadow-sm:  0 1px 2px rgba(0,0,0,0.05)      /* Subtle elevation */
shadow:     0 1px 3px rgba(0,0,0,0.1)       /* Cards, inputs */
shadow-md:  0 4px 6px rgba(0,0,0,0.1)       /* Elevated cards */
shadow-lg:  0 10px 15px rgba(0,0,0,0.1)     /* Modals, dropdowns */
shadow-xl:  0 20px 25px rgba(0,0,0,0.1)     /* High elevation */
shadow-2xl: 0 25px 50px rgba(0,0,0,0.15)    /* Hero sections */
```

### Z-Index Scale

```css
z-0:    0    /* Base layer */
z-10:   10   /* Elevated elements */
z-20:   20   /* Sticky headers */
z-30:   30   /* Dropdowns, popovers */
z-40:   40   /* Modal backdrop */
z-50:   50   /* Modal content */
```

---

## Landing Page Specifications

### High-Fidelity Landing Page Design

#### Hero Section

**Layout:**
- Full viewport height (min-h-screen)
- Two-column layout (desktop): 60% text / 40% visual
- Single column (mobile): stacked
- Background: Subtle gradient from white to muted teal (#F1F5F9 to #E6F2F0)

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Sticky)                                                │
│  [ZERO Logo]  Gafas de Sol | Gafas con Receta  [Buscar] [🛒] [👤]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [LEFT 60%]                          [RIGHT 40%]               │
│                                                                 │
│  CERO INTERMEDIARIOS                 [Hero Image]              │
│  CERO COMPLICACIONES                 Professional eyewear      │
│  CERO LÍMITES                        lifestyle photo           │
│                                      or 3D product render       │
│  Tu vista merece más que lo mismo    High-quality,             │
│  de siempre. 25 años conectando      aspirational              │
│  calidad directamente contigo.       Image with soft           │
│                                      shadow/gradient           │
│  [Explorar Colección] [Cómo Funciona]                          │
│                                                                 │
│  ✓ Envío gratis en compras +$50     ✓ Garantía de 30 días    │
│  ✓ Lentes con receta en 7-10 días   ✓ Soporte WhatsApp       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Typography:**
- Headline "CERO INTERMEDIARIOS..." - Inter 800, 72px, --foreground, line-height 1.1
- Subheading - Inter 500, 20px, --muted-foreground, line-height 1.6
- Trust badges - Inter 500, 16px, --foreground with checkmark icons

**Buttons:**
- Primary CTA: "Explorar Colección" - Primary color, large (px-8 py-4), shadow-lg
- Secondary CTA: "Cómo Funciona" - Outlined, secondary color
- Hover: Lift effect (translateY -2px) + larger shadow

**Visual Elements:**
- Gradient background: `bg-gradient-to-br from-white via-slate-50 to-teal-50/30`
- Floating elements: Subtle animated shapes (optional, CSS animation)
- High-quality product photography or 3D renders
- Subtle parallax on scroll (optional)

---

#### Trust Section

**Layout:**
- Container: max-w-7xl mx-auto px-6 py-24
- 4-column grid (desktop), 2-column (tablet), 1-column (mobile)

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Por Qué Elegir ZERO                                            │
├─────────────────────────────────────────────────────────────────┤
│  [Icon]           [Icon]           [Icon]           [Icon]      │
│  25+ Años         Calidad          Envío           Soporte      │
│  Experiencia      Garantizada      Gratis          Experto      │
│                                                                 │
│  Conectando...    Trabajamos...    Compras +$50... WhatsApp...  │
└─────────────────────────────────────────────────────────────────┘
```

**Cards:**
- Background: white with subtle shadow
- Border: 1px solid --border
- Padding: p-8
- Border-radius: rounded-xl
- Hover: shadow-lg transition
- Icon: teal accent color, 48px
- Title: Inter 600, 20px, --foreground
- Description: Inter 400, 16px, --muted-foreground

---

#### Featured Products Section

**Layout:**
- Background: --muted (#F1F5F9)
- Container: max-w-7xl mx-auto px-6 py-24
- Product grid: 4 columns (desktop), 2 columns (mobile)

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Productos Destacados                                           │
│  Descubre nuestra selección curada                              │
├─────────────────────────────────────────────────────────────────┤
│  [Product]  [Product]  [Product]  [Product]                     │
│  Card       Card       Card       Card                          │
│                                                                 │
│                [Ver Toda la Colección →]                         │
└─────────────────────────────────────────────────────────────────┘
```

**Product Card:**
- Aspect ratio: 4:3 or 1:1 for image
- Background: white
- Shadow: shadow-md on hover (shadow-sm default)
- Padding: p-4
- Image: rounded-lg, object-cover
- NEW/SALE badge: absolute top-right, accent color
- Brand: text-sm text-muted-foreground
- Title: text-lg font-semibold
- Price: text-xl font-bold text-primary
- Wishlist: Heart icon, absolute top-left, hover animation
- Add to cart: Primary button, full-width on hover/mobile

---

#### How It Works Section

**Layout:**
- Container: max-w-5xl mx-auto px-6 py-24
- 3-column grid with connecting lines (desktop)
- Vertical timeline (mobile)

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Cómo Funciona                                                  │
│  Lentes con receta en 3 simples pasos                           │
├─────────────────────────────────────────────────────────────────┤
│  [1] ────────→ [2] ────────→ [3]                                │
│  Elige tu      Sube tu       Recibe en                          │
│  montura       receta         7-10 días                         │
│                                                                 │
│  [Comenzar Ahora]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Step Cards:**
- Large number: text-6xl font-bold text-primary/20 (watermark effect)
- Icon: teal color, 64px
- Title: Inter 600, 24px
- Description: Inter 400, 16px, text-muted-foreground
- Connecting line: dashed border-t-2 border-primary/30

---

#### Testimonials Section

**Layout:**
- Background: white
- Container: max-w-7xl mx-auto px-6 py-24
- Carousel or grid (3 columns desktop, 1 mobile)

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Lo Que Dicen Nuestros Clientes                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Review Card 1]  [Review Card 2]  [Review Card 3]              │
│  ⭐⭐⭐⭐⭐         ⭐⭐⭐⭐⭐         ⭐⭐⭐⭐⭐                │
│  "Testimonial"    "Testimonial"    "Testimonial"                │
│  - Customer Name  - Customer Name  - Customer Name              │
└─────────────────────────────────────────────────────────────────┘
```

**Review Card:**
- Background: --muted with border
- Padding: p-6
- Border-radius: rounded-xl
- Stars: accent color (#E8734E)
- Quote: text-lg italic
- Avatar: rounded-full, 48px
- Name: font-semibold
- Verified badge: small badge with checkmark

---

#### CTA Section (Final Push)

**Layout:**
- Background: Gradient from primary to primary-hover
- Full-width section
- Container: max-w-4xl mx-auto px-6 py-20
- Centered text, white text

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ¿Listo Para Ver La Diferencia?                                 │
│  Únete a miles de clientes satisfechos en toda Latinoamérica    │
│                                                                 │
│  [Explorar Colección]  [Contactar Soporte]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Headline: text-5xl font-bold text-white
- Subheading: text-xl text-white/90
- Buttons: White background with primary text (inverted)
- Hover: Scale up slightly

---

#### Footer

**Layout:**
- Background: --foreground (#0F172A) dark slate
- Text: white/muted
- 4-column grid (desktop), stacked (mobile)
- Padding: px-6 py-16

**Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [ZERO Logo]                                                    │
│                                                                 │
│  Nosotros     Ayuda          Legal          Contacto            │
│  - Historia   - Guía Tallas  - Privacidad   - Email            │
│  - Misión     - Envíos       - Términos     - Teléfono         │
│  - Equipo     - Devoluciones - Devoluciones - WhatsApp         │
│                                              - Redes            │
│                                                                 │
│  © 2025 ZERO. Todos los derechos reservados.                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Landing Page Visual Hierarchy

**Priority 1 (Most Visible):**
- Hero headline
- Primary CTA button
- Hero image

**Priority 2:**
- Subheading
- Trust badges
- Secondary CTA

**Priority 3:**
- Product cards
- Feature icons
- Section headings

**Priority 4:**
- Body text
- Footer links
- Testimonials

---

## Components Library

### Component Tiers

#### TIER 1: Foundational (shadcn/ui)

1. **Button** - All variants (default, destructive, outline, secondary, ghost, link)
2. **Input** - Text, email, password, number, tel, search
3. **Label** - Form labels with required indicators
4. **Badge** - Status badges, count badges
5. **Card** - Container component (Card, CardHeader, CardTitle, CardContent, CardFooter)
6. **Separator** - Horizontal/vertical dividers
7. **Skeleton** - Loading placeholders

#### TIER 2: Forms

8. **Textarea** - Multi-line text input
9. **Select** - Dropdown selects
10. **Checkbox** - Single and grouped
11. **Radio Group** - Option selection
12. **Switch** - Toggle switches
13. **Slider** - Range inputs
14. **Form** - Form wrapper with validation

#### TIER 3: Navigation

15. **Navigation Menu** - Header navigation
16. **Breadcrumb** - Path navigation
17. **Tabs** - Tabbed interfaces
18. **Pagination** - Page navigation
19. **Sheet** - Mobile drawer
20. **Accordion** - Collapsible sections

#### TIER 4: Feedback

21. **Dialog** - Modals and alerts
22. **Popover** - Contextual menus
23. **Tooltip** - Hover help text
24. **Alert** - Notifications
25. **Toast** - Toast notifications
26. **Progress** - Progress indicators

#### TIER 5: Data Display

27. **Table** - Data tables
28. **Avatar** - User avatars
29. **Carousel** - Image carousels
30. **Command** - Command palette
31. **Dropdown Menu** - Action menus

### Custom Components (Built on shadcn)

#### Layout Components

32. **CustomerLayout** - Main customer layout with header/footer
33. **AdminLayout** - Admin layout with sidebar/top nav
34. **HeroSection** - Landing page hero
35. **Container** - Content width wrapper

#### Product Components

36. **ProductCard** - Product display card
37. **ProductGrid** - Responsive product grid
38. **ProductImageGallery** - Image viewer with zoom
39. **PriceDisplay** - Formatted price with sale pricing
40. **StockIndicator** - Stock status badge
41. **RatingStars** - Star rating display/input

#### Prescription Components

42. **PrescriptionToggle** - With/without prescription selector
43. **PrescriptionForm** - Prescription data entry
44. **PrescriptionUpload** - File upload for prescription
45. **PrescriptionDisplay** - Read-only prescription view

#### Treatment Components

46. **TreatmentSelector** - Lens treatment checkboxes
47. **TreatmentSummary** - Selected treatments display

#### Cart & Checkout Components

48. **CartItem** - Shopping cart item card
49. **CartSummary** - Order summary sidebar
50. **QuantityStepper** - Quantity selector (+/-)
51. **CheckoutStepper** - Multi-step progress indicator
52. **AddressCard** - Saved address display/selector
53. **ShippingMethodSelector** - Shipping options
54. **PaymentWidget** - Payment integration wrapper
55. **OrderConfirmation** - Success page content

#### Order & Account Components

56. **OrderCard** - Order summary card
57. **OrderStatusTimeline** - Order tracking timeline
58. **AccountSidebar** - Account navigation
59. **QuickStatsCard** - Dashboard metric card

#### Review Components

60. **ReviewCard** - Customer review display
61. **ReviewForm** - Review submission form

#### Search & Filter Components

62. **SearchBar** - Search input with autocomplete
63. **FilterSidebar** - Filter panel (desktop)
64. **FilterChip** - Active filter tag
65. **SortDropdown** - Sort options menu

#### Admin Components

66. **DataTable** - Enhanced table with sorting/filtering
67. **StatusBadge** - Colored status indicators
68. **MetricCard** - KPI display card
69. **PrescriptionValidator** - Prescription validation interface
70. **OrderDetailPanel** - Full order view for admin
71. **StockAdjustmentForm** - Inventory adjustment
72. **SyncStatusCard** - ERP sync status
73. **BulkUploadWizard** - CSV upload interface
74. **ErrorTable** - Validation error display
75. **HierarchicalList** - Drag-drop tree structure
76. **AnalyticsChart** - Data visualization

---

## Responsive Design

### Breakpoints

```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

### Mobile-First Strategy

1. Design for mobile (320px+) first
2. Add responsive enhancements with breakpoints
3. Test on real devices (iPhone SE, iPhone 12, iPad, Desktop)

### Key Responsive Patterns

**Navigation:**
- Mobile: Hamburger → Sheet drawer
- Desktop: Horizontal menu

**Product Grid:**
- < 640px: 2 columns, gap-4
- 640-1024px: 3 columns, gap-6
- > 1024px: 4 columns, gap-8

**Hero Section:**
- Mobile: Stacked (image below text)
- Desktop: Side-by-side (60/40 split)

**Filters:**
- Mobile: Sheet drawer (bottom/side)
- Desktop: Fixed sidebar

**Forms:**
- Mobile: Single column, full-width inputs
- Desktop: Two-column where appropriate

**Typography:**
- Mobile: Reduce font sizes by 25-30%
- Desktop: Full scale

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Focus visible (ring-2 ring-primary ring-offset-2)
- Escape closes modals/drawers
- Enter activates buttons/links

**Screen Readers:**
- ARIA labels on all icons/images
- Semantic HTML (nav, main, footer, article, section)
- Skip to content link
- Form labels properly associated
- Error messages announced

**Motion:**
- Respect prefers-reduced-motion
- Disable animations for users who prefer less motion

**Forms:**
- Clear error messages in Spanish
- Required fields indicated with *
- Helper text for complex inputs
- Validation on blur + submit

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Set up Tailwind config with color palette
- ✅ Install shadcn/ui CLI and foundational components
- ✅ Create layout components (CustomerLayout, AdminLayout)
- ✅ Set up typography and spacing utilities
- ✅ Create component folder structure

### Phase 2: Landing Page (Week 2-3)
- ✅ Build high-fidelity hero section
- ✅ Trust/features section
- ✅ Featured products carousel
- ✅ How it works timeline
- ✅ Testimonials section
- ✅ CTA section
- ✅ Footer with links
- ✅ Mobile responsive optimization
- ✅ Animations and micro-interactions

### Phase 3: Product Components (Week 3-4)
- ✅ ProductCard with all states
- ✅ ProductGrid with loading states
- ✅ ProductImageGallery with zoom
- ✅ Search and filter components
- ✅ Sort functionality
- ✅ Empty states

### Phase 4: Forms & Prescription (Week 4-5)
- ✅ Form components with validation
- ✅ PrescriptionForm with field validation
- ✅ PrescriptionUpload with drag-drop
- ✅ TreatmentSelector with pricing
- ✅ Spanish error messages
- ✅ Accessibility testing

### Phase 5: Cart & Checkout (Week 5-6)
- ✅ CartItem and CartSummary
- ✅ CheckoutStepper multi-step flow
- ✅ AddressCard and shipping selector
- ✅ PaymentWidget integration
- ✅ OrderConfirmation page
- ✅ Email templates

### Phase 6: Account & Orders (Week 6-7)
- ✅ AccountSidebar navigation
- ✅ OrderCard and OrderStatusTimeline
- ✅ ReviewForm and ReviewCard
- ✅ QuickStatsCard
- ✅ Wishlist components

### Phase 7: Admin Dashboard (Week 7-9)
- ✅ AdminLayout with navigation
- ✅ DataTable with sorting/filtering/pagination
- ✅ MetricCard for KPIs
- ✅ PrescriptionValidator
- ✅ OrderDetailPanel
- ✅ Stock management components
- ✅ BulkUploadWizard
- ✅ Analytics charts

### Phase 8: Polish & Testing (Week 9-10)
- ✅ Responsive testing (all devices)
- ✅ Accessibility audit (WCAG AA)
- ✅ Performance optimization (Lighthouse 90+)
- ✅ Cross-browser testing
- ✅ Component documentation (Storybook)
- ✅ E2E testing critical paths

---

## Design Tokens Reference

### Tailwind Config Snippet

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(176 70% 32%)',
          foreground: 'hsl(0 0% 100%)',
          hover: 'hsl(176 70% 28%)',
        },
        accent: {
          DEFAULT: 'hsl(16 85% 58%)',
          foreground: 'hsl(0 0% 100%)',
          hover: 'hsl(16 85% 54%)',
        },
        success: 'hsl(142 76% 36%)',
        warning: 'hsl(32 95% 44%)',
        destructive: 'hsl(0 84% 60%)',
        info: 'hsl(199 89% 48%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## Brand Assets Checklist

- [ ] ZERO logo (SVG, multiple sizes)
- [ ] Favicon set (16px, 32px, 180px, 192px, 512px)
- [ ] Social media images (OG image 1200x630)
- [ ] Hero images (high-res lifestyle photos)
- [ ] Product photography (consistent lighting/backgrounds)
- [ ] Icon set (Lucide React icons)
- [ ] Loading animations
- [ ] Empty state illustrations

---

**Document Version**: 1.0
**Last Updated**: November 2, 2025
**Status**: Ready for Implementation
**Approved By**: Product Team
