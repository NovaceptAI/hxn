# Valentine Website for Himanshi 🌸

A playful, elegant, single-page interactive Valentine's Day experience built with Next.js, React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- 🎨 **Minimal Pink Aesthetic**: Soft gradient background with subtle grain texture
- 💫 **Smooth Animations**: Gentle transitions using Framer Motion
- 🎯 **Interactive "No" Button**: Playful dodge mechanic that moves away from cursor
- 📱 **Fully Responsive**: Works beautifully on mobile and desktop
- ♿ **Accessible**: Focus trap, ESC key support, ARIA labels
- 🎵 **Music Toggle UI**: Visual toggle (UI only, no actual audio)
- 🌟 **Modal Flow**: Six-step interactive journey without scrolling

## Architecture

### Modal System
- **State Management**: Uses React useState to track current modal step
- **Focus Trap**: Automatically focuses first interactive element in modals
- **ESC Handler**: Closes modals or shows exit screen after repeated attempts
- **Body Scroll Lock**: Prevents background scrolling when modal is open
- **Progress Indicators**: Subtle dots show user's position in the flow

### "No" Button Dodge Algorithm

The playful "No" button in Modal #3 implements intelligent dodge behavior:

**Desktop (Mouse):**
1. Tracks mouse position via `mousemove` event listener
2. Calculates distance from mouse to button center using Euclidean distance
3. When mouse comes within 90px threshold, button jumps to new random position
4. **Cooldown**: Only moves once every 250ms to prevent jittering
5. **Bounds checking**: New position stays within modal content area with 16px padding
6. **Collision avoidance**: Won't overlap the "Yes" button

**Mobile (Touch):**
1. On tap, increments dodge attempt counter
2. Moves button to new random position within bounds
3. Same collision and bounds logic as desktop

**Progressive Difficulty:**
- After 3 failed attempts: Shows text "okay okay, dramatic much."
- After 5 failed attempts: Changes button label to "fine, continue" and allows clicking
- This ensures playfulness without frustration

**Technical Implementation:**
```typescript
// Distance calculation
const distance = Math.sqrt(
  Math.pow(mousePos.x - buttonCenterX, 2) + 
  Math.pow(mousePos.y - buttonCenterY, 2)
)

// Random position generation within bounds
const getRandomPosition = (): Position => {
  const maxX = modalWidth - buttonWidth - padding * 2
  const maxY = modalHeight - buttonHeight - padding * 2
  return {
    x: Math.random() * maxX + padding,
    y: Math.random() * maxY + padding
  }
}
```

## File Structure

```
valentine-for-himanshi/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component with all logic
│   └── globals.css         # Global styles + grain texture
├── public/                 # (empty, no external assets needed)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind + pink theme
├── postcss.config.js       # PostCSS config
├── next.config.js          # Next.js config
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Build for production (optional):**
   ```bash
   npm run build
   npm start
   ```

## Design Details

### Color Palette
- `valentine-pink`: #fce4ec (light blush)
- `valentine-rose`: #f8bbd0 (soft rose)
- `valentine-deep`: #f48fb1 (medium pink)
- `valentine-accent`: #ec407a (vibrant accent)

### Typography
- **Headings**: UI Serif (system serif fonts)
- **Body**: UI Sans (system sans-serif fonts)
- Clean, readable, editorial feel

### Animations
- **Modal Entry**: Scale + fade with spring physics
- **Button Hovers**: Subtle scale (1.05x) + color transitions
- **Floating Hearts**: 8 hearts with staggered animation on "Yes" click
- **No Button Dodge**: Smooth 0.3s ease-out transition

### Grain Texture
Achieved via pure CSS using repeating-linear-gradient at 3% opacity for subtle editorial texture.

## Modal Flow

1. **Landing**: Hero with title, subtitle, and "open it" button
2. **Modal 1**: Introduction - sets non-pushy tone
3. **Modal 2**: Compliment - playful self-awareness line
4. **Modal 3**: Valentine question - "Yes" works, "No" dodges cursor
5. **Modal 4**: Confirmation - after saying yes
6. **Modal 5**: Poetic closure - signed by Nova
7. **Modal 6**: Exit - graceful end with no pressure

## Accessibility Features

- ✅ Focus trap in modals
- ✅ ESC key closes modals
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast text
- ✅ Touch-friendly button sizes (mobile)

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

To personalize for different names or messages, edit the text content in [app/page.tsx](app/page.tsx):

- Line 267: Change "Hi Himanshi 🌸" to your recipient's name
- Lines 270-275: Modify subtitle text
- Modal content strings throughout the `renderModal()` function

## License

Personal project - use freely for your own Valentine's Day surprises! 💖

---

**Made with love by Nova** 🌸
