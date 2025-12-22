# Guía Completa: Migración de Cesante Manager a Android

**Objetivo:** Adaptar la aplicación desktop actual a Android manteniendo todas las funcionalidades, con diseño responsive optimizado para móvil.

---

## 📋 FASE 1: Configuración de Tauri para Android

### 1.1 Instalar dependencias Android

```powershell
# Instalar Android Studio y Android SDK
# Descargar de: https://developer.android.com/studio

# Instalar NDK y herramientas (desde Android Studio)
# SDK Manager → SDK Tools → NDK (Side by side)
# SDK Manager → SDK Tools → CMake
# SDK Manager → SDK Tools → Android SDK Command-line Tools

# Configurar variables de entorno
$env:ANDROID_HOME = "C:\Users\usuario\AppData\Local\Android\Sdk"
$env:NDK_HOME = "$env:ANDROID_HOME\ndk\[version]"

# Agregar Rust targets para Android
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android

# Instalar cargo-ndk
cargo install cargo-ndk
```

### 1.2 Inicializar configuración Android en Tauri

```powershell
cd C:\Users\usuario\Desktop\anfpes-engine\apps\ui
npm run tauri android init
```

### 1.3 Modificar `tauri.conf.json`

**Ubicación:** `apps/ui/src-tauri/tauri.conf.json`

```json
{
  "$schema": "../../../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "Cesante Manager",
  "version": "0.1.0",
  "identifier": "com.cesante.manager",
  "build": {
    "frontendDist": "../dist",
    "beforeDevCommand": "",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "Cesante Manager",
        "fullscreen": true,
        "resizable": true, // ← CAMBIAR a true para Android
        "decorations": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["app", "android"], // ← AGREGAR android
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "android": {
      "minSdkVersion": 24,
      "versionCode": 1
    },
    "windows": {
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  }
}
```

---

## 📋 FASE 2: Detección de Plataforma y Configuración Base

### 2.1 Crear hook de detección de plataforma

**Crear archivo:** `apps/ui/src/hooks/usePlatform.ts`

```typescript
import { useState, useEffect } from 'react';

export type Platform = 'desktop' | 'android' | 'ios';
export type Orientation = 'portrait' | 'landscape';

interface PlatformInfo {
  platform: Platform;
  orientation: Orientation;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    return {
      platform: detectPlatform(),
      orientation: width > height ? 'landscape' : 'portrait',
      isMobile,
      screenWidth: width,
      screenHeight: height,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setInfo({
        platform: detectPlatform(),
        orientation: width > height ? 'landscape' : 'portrait',
        isMobile: width < 768,
        screenWidth: width,
        screenHeight: height,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return info;
}

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) {
    return 'android';
  }
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  return 'desktop';
}
```

### 2.2 Crear store de plataforma

**Crear archivo:** `apps/ui/src/store/platformStore.ts`

```typescript
import { create } from 'zustand';

interface PlatformState {
  isMobile: boolean;
  orientation: 'portrait' | 'landscape';
  setIsMobile: (isMobile: boolean) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  isMobile: window.innerWidth < 768,
  orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  setIsMobile: (isMobile) => set({ isMobile }),
  setOrientation: (orientation) => set({ orientation }),
}));
```

---

## 📋 FASE 3: Sistema de CSS Responsive

### 3.1 Crear variables CSS para mobile

**Modificar:** `apps/ui/src/styles.css`

**AGREGAR al inicio del archivo (después de :root):**

```css
/* Variables responsive */
:root {
  /* Espaciados móviles */
  --mobile-padding: 0.75rem;
  --mobile-gap: 0.5rem;
  --mobile-header-height: 3.5rem;
  --mobile-tab-height: 3rem;

  /* Tamaños de fuente móviles */
  --mobile-font-xs: 0.7rem;
  --mobile-font-sm: 0.8rem;
  --mobile-font-base: 0.9rem;
  --mobile-font-lg: 1rem;
  --mobile-font-xl: 1.1rem;

  /* Breakpoints */
  --breakpoint-mobile: 768px;
  --breakpoint-tablet: 1024px;
}

/* Media query para móvil */
@media (max-width: 768px) {
  body {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-shell {
    height: auto;
    min-height: 100vh;
    padding: 0;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #0d1016;
    padding: var(--mobile-padding);
    flex-direction: column;
    gap: var(--mobile-gap);
  }

  .app-main {
    padding: var(--mobile-padding);
    overflow-y: auto;
    height: auto;
  }

  /* Tabs móviles: scroll horizontal */
  .module-tabs {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
  }

  .module-tabs::-webkit-scrollbar {
    height: 4px;
  }

  .module-tabs::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  /* Botón salir más pequeño */
  .exit-button {
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    margin: 0;
  }

  /* Modal responsive */
  .modal-overlay {
    padding: var(--mobile-padding);
  }

  .exit-modal {
    max-width: 90vw;
    padding: 1.5rem;
  }

  /* Navegación con iconos más grandes */
  .module-tabs .nav-button {
    min-width: 36px;
    min-height: 36px;
  }
}
```

---

## 📋 FASE 4: Adaptar Componentes Principales

### 4.1 Modificar App.tsx para detectar plataforma

**Modificar:** `apps/ui/src/App.tsx`

**REEMPLAZAR el componente completo:**

```tsx
import { useEffect, useState } from 'react';
import { useCacheLoader } from './store/cacheStore';
import { ModuleTabs, type ModuleDefinition } from './components/ModuleTabs';
import { GlossaryModal } from './components/GlossaryModal';
import { SplashScreen } from './components/SplashScreen';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { HomeModule } from './modules/HomeModule';
import { PlayerSearch } from './components/PlayerSearch';
import { PlayerProfile } from './components/PlayerProfile';
import { PreselectionModule } from './modules/PreselectionModule';
import { SimilarPlayersModule } from './modules/SimilarPlayersModule';
import { ComparatorModule } from './modules/ComparatorModule';
import { PlanningModule } from './modules/PlanningModule';
import { useModuleStore, MODULE_IDS } from './store/moduleStore';
import { PlayerActionsOverlay } from './components/PlayerActionsOverlay';
import { useNavigationHistoryStore } from './store/navigationHistoryStore';
import { usePlatform } from './hooks/usePlatform'; // ← NUEVO
import { usePlatformStore } from './store/platformStore'; // ← NUEVO

const modules: ModuleDefinition[] = [
  { id: MODULE_IDS.dashboard, label: 'Home', component: HomeModule },
  { id: MODULE_IDS.search, label: 'Buscador', component: PlayerSearch },
  {
    id: MODULE_IDS.preselections,
    label: 'Preselecciones',
    component: PreselectionModule,
  },
  { id: MODULE_IDS.similar, label: 'Similares', component: SimilarPlayersModule },
  { id: MODULE_IDS.comparator, label: 'Comparador', component: ComparatorModule },
  { id: MODULE_IDS.planning, label: 'Planificación', component: PlanningModule },
  { id: MODULE_IDS.profile, label: 'Perfil', component: PlayerProfile },
];

export default function App() {
  useCacheLoader();

  // ← NUEVO: Detectar plataforma
  const platformInfo = usePlatform();
  const { setIsMobile, setOrientation } = usePlatformStore();

  const activeModuleId = useModuleStore((state) => state.activeModuleId);
  const setActiveModuleId = useModuleStore((state) => state.setActiveModuleId);
  const navigateBack = useModuleStore((state) => state.navigateBack);
  const navigateForward = useModuleStore((state) => state.navigateForward);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  // ← NUEVO: Actualizar store de plataforma
  useEffect(() => {
    setIsMobile(platformInfo.isMobile);
    setOrientation(platformInfo.orientation);
  }, [platformInfo.isMobile, platformInfo.orientation, setIsMobile, setOrientation]);

  // Initialize history with dashboard on mount
  useEffect(() => {
    const { push, history } = useNavigationHistoryStore.getState();
    if (history.length === 0) {
      push(MODULE_IDS.dashboard, {});
    }
  }, []);

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleExitModalClose = () => {
    setShowExitModal(false);
  };

  // Keyboard shortcuts (solo desktop)
  useEffect(() => {
    if (platformInfo.isMobile) return; // ← NUEVO: Skip en móvil

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateBack();
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        navigateForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBack, navigateForward, platformInfo.isMobile]);

  // ← NUEVO: Clase condicional para móvil
  const appShellClass = platformInfo.isMobile ? 'app-shell mobile' : 'app-shell';

  return (
    <div className={appShellClass}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="app-header">
        <ModuleTabs
          modules={modules}
          activeId={activeModuleId}
          onSelect={setActiveModuleId}
          onNavigateBack={navigateBack}
          onNavigateForward={navigateForward}
          onOpenGlossary={() => setIsGlossaryOpen(true)}
        />
        {!platformInfo.isMobile && ( // ← NUEVO: Botón salir solo desktop
          <button
            type="button"
            className="exit-button"
            onClick={handleExitClick}
            title="Salir de la aplicación"
          >
            Salir
          </button>
        )}
      </div>
      <main className="app-main">
        {modules.map((module) => {
          const ModuleComponent = module.component;
          return (
            <div
              key={module.id}
              style={{
                display: activeModuleId === module.id ? 'block' : 'none',
                height: '100%',
              }}
            >
              <ModuleComponent />
            </div>
          );
        })}
      </main>
      <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
      {showExitModal && <ExitConfirmModal onClose={handleExitModalClose} />}
      <PlayerActionsOverlay />
    </div>
  );
}
```

---

## 📋 FASE 5: Adaptar HomeModule (Vista Principal)

### 5.1 Crear versión móvil del Home

**Modificar:** `apps/ui/src/modules/HomeModule.tsx`

**ESTRATEGIA:**

- Desktop: Tabla horizontal con todas las columnas
- Mobile: Cards verticales con información resumida

**BUSCAR la sección del return principal y MODIFICAR:**

```tsx
import { usePlatformStore } from '../store/platformStore'; // ← AGREGAR import

// ... resto del código existente ...

export function HomeModule() {
  // ... código existente ...
  const { isMobile } = usePlatformStore(); // ← AGREGAR

  // ... resto del código ...

  return (
    <div className="home-module">
      {/* Filtros panel - mantener igual */}
      <FiltersPanel /* ... */ />

      {/* Contenido principal - condicional */}
      {isMobile ? (
        <MobilePlayerList players={filteredPlayers} /> // ← NUEVO componente
      ) : (
        <DesktopPlayerTable players={filteredPlayers} /> // ← Envolver tabla existente
      )}
    </div>
  );
}
```

### 5.2 Crear componente MobilePlayerList

**Crear archivo:** `apps/ui/src/components/MobilePlayerList.tsx`

```tsx
import type { Player } from '../types';
import { useModuleStore } from '../store/moduleStore';

interface MobilePlayerListProps {
  players: Player[];
}

export function MobilePlayerList({ players }: MobilePlayerListProps) {
  const { openProfile } = useModuleStore();

  if (players.length === 0) {
    return (
      <div className="mobile-empty-state">
        <p>No se encontraron jugadores</p>
      </div>
    );
  }

  return (
    <div className="mobile-player-list">
      {players.map((player) => (
        <div
          key={player.id}
          className="mobile-player-card"
          onClick={() => openProfile(player.id)}
        >
          <div className="mobile-player-header">
            <div className="mobile-player-image">
              {player.imageUrl ? (
                <img src={player.imageUrl} alt={player.name} />
              ) : (
                <div className="mobile-player-placeholder">👤</div>
              )}
            </div>
            <div className="mobile-player-info">
              <h3 className="mobile-player-name">{player.name}</h3>
              <div className="mobile-player-meta">
                <span className="mobile-player-age">{player.age} años</span>
                <span className="mobile-player-position">{player.position}</span>
              </div>
            </div>
          </div>

          <div className="mobile-player-stats">
            <div className="mobile-stat">
              <span className="mobile-stat-label">Club</span>
              <span className="mobile-stat-value">{player.club}</span>
            </div>
            <div className="mobile-stat">
              <span className="mobile-stat-label">Valor</span>
              <span className="mobile-stat-value">{player.value}</span>
            </div>
            <div className="mobile-stat">
              <span className="mobile-stat-label">Rating</span>
              <span className="mobile-stat-value mobile-stat-highlight">
                {player.rating}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 5.3 Agregar estilos para MobilePlayerList

**Agregar a:** `apps/ui/src/styles.css`

```css
/* Mobile Player List Styles */
@media (max-width: 768px) {
  .mobile-player-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .mobile-player-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mobile-player-card:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.05);
  }

  .mobile-player-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .mobile-player-image {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
  }

  .mobile-player-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .mobile-player-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .mobile-player-info {
    flex: 1;
    min-width: 0;
  }

  .mobile-player-name {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mobile-player-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .mobile-player-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .mobile-stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mobile-stat-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .mobile-stat-value {
    font-size: 0.9rem;
    color: #fff;
    font-weight: 500;
  }

  .mobile-stat-highlight {
    color: #4ade80;
    font-weight: 600;
  }

  .mobile-empty-state {
    padding: 3rem 1rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }
}
```

---

## 📋 FASE 6: Adaptar PlayerProfile (Vista de Perfil)

**Modificar:** `apps/ui/src/components/PlayerProfile.tsx`

### 6.1 Hacer el perfil responsive

**AGREGAR imports:**

```tsx
import { usePlatformStore } from '../store/platformStore';
```

**MODIFICAR el return principal:**

```tsx
export function PlayerProfile() {
  // ... código existente ...
  const { isMobile, orientation } = usePlatformStore(); // ← AGREGAR

  // ... código existente ...

  const profileClass = isMobile
    ? `player-profile mobile ${orientation}`
    : 'player-profile';

  return <div className={profileClass}>{/* Contenido adaptado */}</div>;
}
```

### 6.2 CSS responsive para PlayerProfile

**Agregar a:** `apps/ui/src/styles.css`

```css
/* Player Profile Mobile */
@media (max-width: 768px) {
  .player-profile {
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow-y: auto;
  }

  .player-profile.mobile {
    gap: 1rem;
  }

  /* Header del perfil */
  .profile-header {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* Tabs en móvil: scroll horizontal */
  .profile-tabs {
    display: flex;
    overflow-x: auto;
    scrollbar-width: thin;
    gap: 0.5rem;
    padding: 0 1rem;
  }

  .profile-tab {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  /* Radar chart más pequeño */
  .radar-chart-container {
    max-width: 100%;
    height: 300px;
  }

  /* Stats en columnas */
  .player-stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
}
```

---

## 📋 FASE 7: Adaptar PlanningModule (Planificación Táctica)

**Esta es la sección MÁS COMPLEJA porque incluye el pitch táctico.**

### 7.1 Estrategia para móvil:

1. **Portrait:** Vista en tabs (Formación → Jugadores → Análisis)
2. **Landscape:** Similar a desktop pero más compacto

**Modificar:** `apps/ui/src/modules/PlanningModule.tsx`

```tsx
import { usePlatformStore } from '../store/platformStore';

export function PlanningModule() {
  // ... código existente ...
  const { isMobile, orientation } = usePlatformStore();
  const [mobileTab, setMobileTab] = useState<'formation' | 'players' | 'analysis'>(
    'formation',
  );

  if (isMobile && orientation === 'portrait') {
    return (
      <div className="planning-module mobile portrait">
        {/* Tabs superiores */}
        <div className="mobile-planning-tabs">
          <button
            className={mobileTab === 'formation' ? 'active' : ''}
            onClick={() => setMobileTab('formation')}
          >
            Formación
          </button>
          <button
            className={mobileTab === 'players' ? 'active' : ''}
            onClick={() => setMobileTab('players')}
          >
            Jugadores
          </button>
          <button
            className={mobileTab === 'analysis' ? 'active' : ''}
            onClick={() => setMobileTab('analysis')}
          >
            Análisis
          </button>
        </div>

        {/* Contenido según tab */}
        {mobileTab === 'formation' && <TacticalPitch /* ... */ />}
        {mobileTab === 'players' && <RosterPanel /* ... */ />}
        {mobileTab === 'analysis' && <TacticalAnalysisPanel /* ... */ />}
      </div>
    );
  }

  // Desktop/Landscape: layout existente
  return <div className="planning-module">{/* Layout actual */}</div>;
}
```

### 7.2 CSS para Planning Mobile

```css
@media (max-width: 768px) {
  .planning-module.mobile.portrait {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .mobile-planning-tabs {
    display: flex;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .mobile-planning-tabs button {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mobile-planning-tabs button.active {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: #3b82f6;
  }

  /* Pitch táctico responsive */
  .tactical-pitch {
    width: 100%;
    height: auto;
    aspect-ratio: 2/3;
    max-height: 70vh;
  }

  /* Jugadores más grandes en móvil */
  .tactical-player-card {
    width: 60px;
    height: 70px;
    font-size: 0.65rem;
  }
}
```

---

## 📋 FASE 8: Optimizaciones de Rendimiento

### 8.1 Virtualización de listas largas

**Para HomeModule con muchos jugadores:**

```bash
npm install --workspace=@anfpes/ui @tanstack/react-virtual
```

**Modificar MobilePlayerList:**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function MobilePlayerList({ players }: MobilePlayerListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // altura estimada de cada card
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="mobile-player-list"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const player = players[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Card del jugador */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 8.2 Lazy loading de imágenes

**Crear hook:** `apps/ui/src/hooks/useLazyImage.ts`

```typescript
import { useEffect, useState } from 'react';

export function useLazyImage(src: string | undefined) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return { imageSrc, isLoaded };
}
```

---

## 📋 FASE 9: Gestos Touch para Móvil

### 9.1 Agregar swipe navigation

**Instalar librería:**

```bash
npm install --workspace=@anfpes/ui react-swipeable
```

**Modificar App.tsx:**

```tsx
import { useSwipeable } from 'react-swipeable';

export default function App() {
  // ... código existente ...
  const { isMobile } = usePlatformStore();

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) navigateForward();
    },
    onSwipedRight: () => {
      if (isMobile) navigateBack();
    },
    trackMouse: false,
  });

  return (
    <div {...(isMobile ? swipeHandlers : {})} className={appShellClass}>
      {/* ... resto del código ... */}
    </div>
  );
}
```

### 9.2 Pull-to-refresh

**Crear componente:** `apps/ui/src/components/PullToRefresh.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY > 0) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && diff < 150) {
      setPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pulling && !refreshing) {
      const diff = currentY.current - startY.current;
      if (diff > 80) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    }
    setPulling(false);
  };

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pulling, refreshing]);

  return (
    <div className="pull-to-refresh">
      {(pulling || refreshing) && (
        <div className="pull-indicator">
          {refreshing ? 'Actualizando...' : 'Suelta para actualizar'}
        </div>
      )}
      {children}
    </div>
  );
}
```

---

## 📋 FASE 10: Testing y Build

### 10.1 Probar en emulador Android

```powershell
# Iniciar emulador desde Android Studio
# O usar dispositivo físico conectado por USB

cd C:\Users\usuario\Desktop\anfpes-engine\apps\ui

# Desarrollo (hot reload)
npm run tauri android dev

# Build APK de desarrollo
npm run tauri android build -- --debug

# Build APK de producción
npm run tauri android build -- --release
```

### 10.2 Ubicación del APK generado

```
apps/ui/src-tauri/gen/android/app/build/outputs/apk/
  - debug/app-debug.apk
  - release/app-release.apk (firmado)
```

### 10.3 Instalar APK en dispositivo

```powershell
# Usando adb
adb install apps/ui/src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 FASE 11: Ajustes Finales Específicos

### 11.1 Componentes que necesitan atención especial:

**Prioridad ALTA:**

1. ✅ HomeModule → MobilePlayerList (FASE 5)
2. ✅ PlayerProfile → Responsive tabs (FASE 6)
3. ✅ PlanningModule → Tab-based mobile (FASE 7)
4. ⚠️ DepthAnalysisPanel → Scroll vertical en móvil
5. ⚠️ FiltersPanel → Colapsable/modal en móvil

**Prioridad MEDIA:** 6. PreselectionModule → Cards en móvil 7. ComparatorModule → Comparación vertical 8. TacticalPitch → Touch drag & drop

### 11.2 FiltersPanel móvil

**Modificar:** `apps/ui/src/components/FiltersPanel.tsx`

```tsx
import { usePlatformStore } from '../store/platformStore';
import { useState } from 'react';

export function FiltersPanel(props: FiltersPanelProps) {
  const { isMobile } = usePlatformStore();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <button className="mobile-filters-toggle" onClick={() => setIsOpen(!isOpen)}>
          Filtros {isOpen ? '▲' : '▼'}
        </button>

        {isOpen && (
          <div className="mobile-filters-panel">{/* Contenido de filtros */}</div>
        )}
      </>
    );
  }

  // Desktop: panel normal
  return <div className="filters-panel">{/* ... */}</div>;
}
```

**CSS:**

```css
@media (max-width: 768px) {
  .mobile-filters-toggle {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    font-size: 0.9rem;
    cursor: pointer;
    margin-bottom: 0.75rem;
  }

  .mobile-filters-panel {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
}
```

---

## 📋 FASE 12: Optimización de Assets

### 12.1 Imágenes optimizadas

```bash
# Instalar herramienta de optimización
npm install --save-dev --workspace=@anfpes/ui sharp

# Crear script de optimización
```

**Crear:** `apps/ui/scripts/optimize-images.js`

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../src/assets');
const outputDir = path.join(__dirname, '../src/assets/optimized');

fs.readdirSync(inputDir).forEach((file) => {
  if (file.match(/\.(jpg|jpeg|png)$/i)) {
    sharp(path.join(inputDir, file))
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp')));
  }
});
```

### 12.2 Lazy loading de módulos

**Modificar:** `apps/ui/src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';

// Lazy load de módulos pesados
const PlanningModule = lazy(() =>
  import('./modules/PlanningModule').then((m) => ({ default: m.PlanningModule })),
);
const ComparatorModule = lazy(() =>
  import('./modules/ComparatorModule').then((m) => ({ default: m.ComparatorModule })),
);

const modules: ModuleDefinition[] = [
  { id: MODULE_IDS.dashboard, label: 'Home', component: HomeModule },
  {
    id: MODULE_IDS.planning,
    label: 'Planificación',
    component: PlanningModule,
    lazy: true,
  },
  // ...
];

// En el render:
{
  module.lazy ? (
    <Suspense fallback={<div className="loading">Cargando...</div>}>
      <ModuleComponent />
    </Suspense>
  ) : (
    <ModuleComponent />
  );
}
```

---

## 📋 CHECKLIST FINAL

### Antes de compilar APK:

- [ ] Todos los imports de `usePlatformStore` agregados
- [ ] Media queries móviles en `styles.css`
- [ ] Touch gestures implementados
- [ ] Virtualización en listas largas
- [ ] Lazy loading de módulos pesados
- [ ] Imágenes optimizadas
- [ ] Testing en emulador Android
- [ ] Orientación portrait y landscape probadas
- [ ] Performance aceptable (< 2s carga inicial)

### Compilar APK final:

```powershell
# Limpiar builds anteriores
cd apps/ui/src-tauri
cargo clean

# Build release
cd ..
npm run tauri android build -- --release

# APK estará en:
# apps/ui/src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🚀 COMANDOS RÁPIDOS DE REFERENCIA

```powershell
# Desarrollo desktop
npm run tauri:dev

# Desarrollo Android (emulador/dispositivo)
npm run tauri android dev

# Build Windows EXE
npm run tauri:build

# Build Android APK (debug)
npm run tauri android build -- --debug

# Build Android APK (release)
npm run tauri android build -- --release

# Instalar en dispositivo
adb install apps/ui/src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk

# Ver logs Android
adb logcat | grep cesante
```

---

## 📱 DIFERENCIAS CLAVE DESKTOP vs MÓVIL

| Aspecto            | Desktop             | Móvil (Portrait)          | Móvil (Landscape)          |
| ------------------ | ------------------- | ------------------------- | -------------------------- |
| **Layout**         | Sidebar + contenido | Tabs + contenido vertical | Similar a desktop compacto |
| **Navegación**     | Tabs horizontales   | Tabs scroll horizontal    | Tabs horizontales          |
| **HomeModule**     | Tabla completa      | Cards verticales          | Tabla compacta             |
| **PlayerProfile**  | Multipanel          | Tabs verticales           | Similar desktop            |
| **PlanningModule** | 3 columnas          | 3 tabs separados          | 2 columnas                 |
| **Filtros**        | Panel lateral       | Modal/colapsable          | Panel lateral compacto     |
| **Gestos**         | Mouse + teclado     | Touch + swipe             | Touch + swipe              |
| **Salir**          | Botón visible       | Gesto back Android        | Gesto back Android         |

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Android SDK not found"

```powershell
$env:ANDROID_HOME = "C:\Users\usuario\AppData\Local\Android\Sdk"
```

### Error: "NDK not installed"

- Abrir Android Studio → SDK Manager → SDK Tools → NDK (Side by side) → Apply

### APK no instala en dispositivo

- Habilitar "Orígenes desconocidos" en configuración Android
- Verificar que APK esté firmado (build --release)

### App crashea en Android

```powershell
# Ver logs
adb logcat | grep -i "error\|exception\|crash"
```

### Imágenes no cargan en Android

- Verificar permisos en `AndroidManifest.xml`
- Usar rutas relativas, no absolutas
- Verificar que assets estén en carpeta pública

---

## 📝 NOTAS ADICIONALES

- **Tiempo estimado:** 15-25 horas de desarrollo
- **Priorizar:** HomeModule, PlayerProfile, PlanningModule
- **Testear frecuentemente** en dispositivo real (emulador puede ser lento)
- **Considerar modo oscuro/claro** (opcional, fase futura)
- **Notificaciones push** (opcional, requiere setup adicional)

---

¡Buena suerte con la implementación! 🚀📱
