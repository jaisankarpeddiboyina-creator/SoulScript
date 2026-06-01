# 🌌 SoulScript | Premium Quote Card Platform

SoulScript is an elegant, full-featured showcase and card generator crafted with **React 19**, **Vite**, and **Tailwind CSS v4**. It features a modern dark glassmorphism layout tailored for exploring, designing, and exporting wisdom into beautiful, shareable image content.

---

## ✨ Features

- **🎭 Rich Quote Card Canvas**: Generate custom quote layouts or randomly select highly curated classics. Features custom luxury gradients supporting premium typography options (e.g. *Playfair Display*, *Lora*, *Merriweather*, and *Cormorant Garamond*).
- **📱 Perfected Mobile Viewports**: Fully responsive aspect-ratio card interfaces that prevent layout overflow and auto-scale typographic sizes dynamically on smaller mobile screens.
- **🛠️ Precision Fine-Tuning**: Toggle individual card elements instantly—quote marks, author citations, short gold dividing rules, and the subtle premium `SOULSCRIPT` watermark.
- **📚 Curated Collections & Custom Playlists**: Group your favorite wisdom into custom folders or choose from our extensive system categories (e.g., Mindfulness, Stoicism, Grit & Perseverance).
- **💾 High-Definition Downloads & Batch Zip Exports**:
  - **PNG Render**: Implements exact-aspect, pixel-perfect container-to-bitmap calculations.
  - **Single & Multi-Select Favorites**: Highlight several items at once and batch-download them instantly in a nicely organized `.zip` file.
- **✨ Fluid Micro-Interactions**: Features premium, hardware-accelerated entering and hovering transitions powered by `motion` (`framer-motion`).

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (from `motion/react`)
- **Canvas Generation**: [html2canvas](https://html2canvas.hertzen.com/) (capturing rich CSS styling layouts)
- **Component Utilities**: [lucide-react](https://lucide.dev/) (modern vector icons), [tailwind-merge](https://github.com/dcastil/tailwind-merge) & [clsx](https://github.com/lukeed/clsx)
- **Local Databases/Stores**: Highly efficient multi-screen synchronized State Controllers supporting interactive creation.

---

## 🚀 Getting Started

Follow these steps to run SoulScript on your local setup:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine (version 18+ is highly recommended).

### 2. Install Dependencies
Run the following package manager command at the project root to fetch essential packages:
```bash
npm install
```

### 3. Run Development Server
Spins up the Vite process dynamically on host `0.0.0.0` at port `3000`:
```bash
npm run dev
```
Open your browser to [http://localhost:3000](http://localhost:3000) to view the development page.

### 4. Code Quality & Formatting
Run the linter to verify full type-safety and standard configuration rules:
```bash
npm run lint
```

### 5. Production Build
Compiles static distribution assets inside the `/dist` directory for lightning-fast edge delivery:
```bash
npm run build
```

---

## 🎨 Visual Identity Guidelines

- **Typography**: Paired serif headings (*Playfair Display*, *Cormorant*) for wisdom rendering with highly readable geometric sans-serif faces (*Inter*) for interface actions and navigation menus.
- **Palette**: Dark, premium glassmorphism theme using rich deep purples (`#160824` to `#340B2D`), golden visual dividers (`#FFD700`), and clean text elements.
- **Layout Rhythm**: Comfortable, responsive, safe border margins preventing content compression. Text sizes scale down proactively depending on block length to ensure 100% of quotes fit cleanly under any viewport dimension.
