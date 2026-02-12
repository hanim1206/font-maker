# CLAUDE.md

> Guidelines for AI assistants working on this codebase.

## Project Overview

**Font Maker** is a web-based Korean (Hangul) font design tool. Users visually edit individual strokes of Hangul jamo (consonants/vowels), configure layout presets for different syllable compositions, and preview results in real time. It runs as a PWA with offline support.

- **Language**: TypeScript (strict mode)
- **Framework**: React 19 + Vite 5
- **State Management**: Zustand + Immer
- **Styling**: CSS Modules (dark theme, purple accent `#7c3aed`)

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # TypeScript check + Vite production build (tsc -b && vite build)
npm run lint      # ESLint validation
npm run preview   # Serve production build locally
```

There is no test framework configured. Use `npm run build` for type checking and `npm run lint` for linting.

## Project Structure

```
src/
├── components/
│   ├── ControlPanel/         # Left sidebar - layout/character selection
│   ├── PreviewPanel/         # Text input and character preview grid
│   ├── EditorPanel/          # Routes between LayoutEditor and JamoEditor
│   │   ├── LayoutEditor.tsx  # Split/Padding adjustment with sliders
│   │   ├── JamoEditor.tsx    # Jamo stroke editing
│   │   └── SplitEditor.tsx   # Slider controls for splits/padding
│   ├── CharacterEditor/      # Stroke editing UI (preview, list, inspector)
│   └── BoxEditor/            # LEGACY - replaced by SplitEditor, do not use
├── stores/                   # Zustand stores
│   ├── uiStore.ts            # UI state (viewMode, selections, mobile detection)
│   ├── layoutStore.ts        # Layout schemas and presets (LocalStorage-persisted)
│   └── jamoStore.ts          # Jamo stroke data (LocalStorage-persisted)
├── data/
│   ├── Hangul.ts             # Jamo character lists and classifications
│   ├── baseJamos.json        # Default jamo stroke data
│   ├── basePresets.json      # Default layout presets
│   └── layoutConfigs.ts      # Layout configuration schemas
├── renderers/
│   └── SvgRenderer.tsx       # SVG rendering engine
├── utils/
│   ├── hangulUtils.ts        # Syllable decomposition, layout classification
│   ├── layoutCalculator.ts   # Box position calculation from schemas
│   ├── pathUtils.ts          # Path/curve utilities
│   └── storage.ts            # LocalStorage management
├── types/
│   └── index.ts              # All TypeScript type definitions
├── App.tsx                   # Main app (responsive desktop/mobile layout)
├── main.tsx                  # Entry point
├── App.css / index.css       # Global and app-level styles
```

## Architecture

### Data Flow Pipeline

```
User input (Korean text)
  → decomposeSyllable()      # Unicode-based syllable decomposition
  → classifyLayout()         # Determine which of 10 layout types applies
  → getLayoutSchema()        # Retrieve Split + Padding config
  → calculateBoxes()         # Compute box positions (BoxConfig[])
  → SvgRenderer              # Render strokes into SVG
```

### State Stores (Zustand + Immer)

- **uiStore**: View mode (`preview`/`presets`/`editor`), input text, selections, mobile state, editing mode (`layout`/`jamo`)
- **layoutStore**: Layout schemas for 10 layout types, Split/Padding values. Persisted to LocalStorage under `font-maker-layout-schemas`.
- **jamoStore**: Stroke data for all choseong (19), jungseong (21), jongseong (27). Persisted to LocalStorage under `font-maker-jamo-data`.

### Key Domain Concepts

**10 Layout Types**: Hangul syllables map to one of 10 layouts based on which jamo are present and the jungseong orientation (vertical/horizontal/mixed). Types are defined as the `LayoutType` union in `src/types/index.ts`.

**Split + Padding System**: Layouts use division lines (`Split`, axis + 0-1 ratio) and internal margins (`Padding`) instead of raw coordinates. `calculateBoxes()` converts these into `BoxConfig` objects.

**Normalized Coordinates (0-1)**: All stroke positions and sizes use 0-1 range for resolution independence. Scaling happens at render time in `SvgRenderer`.

**Mixed Jungseong**: Characters like ㅘ, ㅙ, ㅢ have separate `horizontalStrokes` and `verticalStrokes` arrays rendered into distinct boxes (`JU_H`, `JU_V`).

**Parts**: Rendering units are `CH` (choseong), `JU` (jungseong), `JU_H`/`JU_V` (mixed jungseong halves), `JO` (jongseong).

## Code Conventions

### TypeScript

- Strict mode is enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- All types are centralized in `src/types/index.ts`
- Use union types for constrained values (e.g., `LayoutType`, `Part`)
- Type guards: `isPathStroke()`, `isHangul()`

### React Patterns

- Functional components only (no class components)
- Memoize callbacks with `useCallback` and computed values with `useMemo`
- State accessed via hooks: `useUIStore()`, `useLayoutStore()`, `useJamoStore()`
- Each component has a co-located `.module.css` file for scoped styles
- Desktop uses a 3-panel layout; mobile (<=768px) uses tabs

### Styling

- CSS Modules for all component styles
- Dark theme: background `#0a0a0a`, text `#f5f5f5`
- Accent color: `#7c3aed` (purple)
- Responsive breakpoint: 768px

### Formatting (Prettier)

- Semicolons: yes
- Single quotes
- Trailing commas: ES5
- Print width: 80
- 2-space indentation
- Arrow parens: avoid
- LF line endings

### Linting (ESLint)

- Base: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `react-hooks` (recommended-latest), `react-refresh` (vite)
- Targets: `**/*.{ts,tsx}`

## Commit Convention

This project follows **Conventional Commits**:

```
<type>(<scope>): <subject>
```

- **type** and **scope**: English
- **subject** and **body**: Korean
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`
- Do not include AI watermarks or co-author tags in commit messages

See `COMMIT_CONVENTION.md` for full details.

## Important Notes for AI Assistants

- `src/components/BoxEditor/` is legacy code replaced by `SplitEditor`. Do not modify or extend it.
- No test framework is configured. Validate changes with `npm run build` (type check) and `npm run lint`.
- LocalStorage keys: `font-maker-layout-schemas`, `font-maker-jamo-data`, `font-maker-ui-state`.
- The project uses ES modules (`"type": "module"` in package.json).
- PWA configuration is in `vite.config.ts` with Workbox caching for CDN fonts.
- Refer to `PROJECT_OVERVIEW.md` for detailed architecture diagrams and domain explanations (written in Korean).
