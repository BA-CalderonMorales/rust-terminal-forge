/**
 * 🔤 ASCII Renderer - Pixel-Perfect Text Rendering Engine
 * Crystal-clear text rendering that makes ASCII art look like science fiction
 */

export interface FontMetrics {
  family: string;
  size: number;
  weight: string;
  lineHeight: number;
  charWidth: number;
  charHeight: number;
  baseline: number;
  ascent: number;
  descent: number;
}

export interface RenderConfig {
  font: FontMetrics;
  color: string;
  backgroundColor?: string;
  antialiasing: boolean;
  subpixelRendering: boolean;
  hinting: 'none' | 'slight' | 'medium' | 'full';
}

export interface GlyphInfo {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  advance: number;
  unicode: number;
}

export interface RenderSurface {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * ASCII Renderer - Scientific text rendering that breaks the laws of typography
 */
export class ASCIIRenderer {
  private surfaces: Map<string, RenderSurface> = new Map();
  private fontMetricsCache: Map<string, FontMetrics> = new Map();
  private glyphCache: Map<string, ImageData> = new Map();
  private measureCanvas: HTMLCanvasElement;
  private measureContext: CanvasRenderingContext2D;

  constructor() {
    // Create measurement canvas for font metrics
    this.measureCanvas = document.createElement('canvas');
    this.measureCanvas.width = 100;
    this.measureCanvas.height = 100;
    this.measureContext = this.measureCanvas.getContext('2d')!;
  }

  /**
   * Create a new render surface with scientific precision
   */
  createSurface(
    id: string,
    width: number,
    height: number,
    pixelRatio: number = window.devicePixelRatio || 1
  ): RenderSurface {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // For better performance
      colorSpace: 'srgb'
    })!;

    // Set actual canvas size with pixel ratio
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for pixel ratio
    context.scale(pixelRatio, pixelRatio);

    const surface: RenderSurface = {
      canvas,
      context,
      width,
      height,
      pixelRatio
    };

    this.surfaces.set(id, surface);
    return surface;
  }

  /**
   * Calculate font metrics with quantum precision
   */
  calculateFontMetrics(fontFamily: string, fontSize: number, fontWeight: string = 'normal'): FontMetrics {
    const cacheKey = `${fontFamily}-${fontSize}-${fontWeight}`;
    
    if (this.fontMetricsCache.has(cacheKey)) {
      return this.fontMetricsCache.get(cacheKey)!;
    }

    const ctx = this.measureContext;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Measure character dimensions using 'M' as baseline
    const charMetrics = ctx.measureText('M');
    const charWidth = charMetrics.width;

    // Calculate line height and baseline metrics
    const testString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const metrics = ctx.measureText(testString);
    
    const fontMetrics: FontMetrics = {
      family: fontFamily,
      size: fontSize,
      weight: fontWeight,
      lineHeight: fontSize * 1.2, // Standard terminal line height
      charWidth,
      charHeight: fontSize,
      baseline: metrics.actualBoundingBoxAscent,
      ascent: metrics.actualBoundingBoxAscent || fontSize * 0.8,
      descent: metrics.actualBoundingBoxDescent || fontSize * 0.2
    };

    this.fontMetricsCache.set(cacheKey, fontMetrics);
    return fontMetrics;
  }

  /**
   * Render text with pixel-perfect precision
   */
  renderText(
    surfaceId: string,
    text: string,
    x: number,
    y: number,
    config: RenderConfig
  ): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) {
      throw new Error(`Surface ${surfaceId} not found`);
    }

    const { context } = surface;
    const { font, color, backgroundColor, antialiasing, subpixelRendering } = config;

    // Configure rendering context
    this.configureRenderingContext(context, config);

    // Set font
    context.font = `${font.weight} ${font.size}px ${font.family}`;
    context.fillStyle = color;

    // Handle background if specified
    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(x, y - font.ascent, text.length * font.charWidth, font.lineHeight);
      context.fillStyle = color;
    }

    // Render each character for maximum control
    const chars = Array.from(text); // Handle Unicode properly
    let currentX = x;

    for (const char of chars) {
      this.renderCharacter(surface, char, currentX, y, config);
      currentX += this.getCharacterAdvance(char, font);
    }
  }

  /**
   * Render a single character with scientific precision
   */
  private renderCharacter(
    surface: RenderSurface,
    char: string,
    x: number,
    y: number,
    config: RenderConfig
  ): void {
    const { context } = surface;
    const { font } = config;

    // Check glyph cache first
    const cacheKey = `${char}-${font.family}-${font.size}-${font.weight}-${config.color}`;
    
    if (this.glyphCache.has(cacheKey)) {
      const glyphData = this.glyphCache.get(cacheKey)!;
      context.putImageData(glyphData, x, y - font.ascent);
      return;
    }

    // Render character
    const snappedX = Math.round(x);
    const snappedY = Math.round(y);

    context.fillText(char, snappedX, snappedY);

    // Cache the glyph for future use
    if (this.shouldCacheGlyph(char)) {
      const glyphData = context.getImageData(
        snappedX, 
        snappedY - font.ascent, 
        font.charWidth, 
        font.charHeight
      );
      this.glyphCache.set(cacheKey, glyphData);
    }
  }

  /**
   * Configure rendering context for optimal quality
   */
  private configureRenderingContext(context: CanvasRenderingContext2D, config: RenderConfig): void {
    const { antialiasing, subpixelRendering, hinting } = config;

    // Set text rendering quality
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';

    // Configure antialiasing
    if (antialiasing) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    } else {
      context.imageSmoothingEnabled = false;
    }

    // Configure font rendering hints
    switch (hinting) {
      case 'none':
        context.fontKerning = 'none';
        break;
      case 'slight':
        context.fontKerning = 'auto';
        break;
      case 'medium':
      case 'full':
        context.fontKerning = 'auto';
        break;
    }

    // Enable subpixel rendering if supported and requested
    if (subpixelRendering && 'fontVariantCaps' in context) {
      (context as any).fontVariantCaps = 'normal';
    }
  }

  /**
   * Get character advance width
   */
  private getCharacterAdvance(char: string, font: FontMetrics): number {
    // For monospace fonts, use consistent character width
    if (this.isMonospaceFont(font.family)) {
      return font.charWidth;
    }

    // For proportional fonts, measure actual width
    this.measureContext.font = `${font.weight} ${font.size}px ${font.family}`;
    return this.measureContext.measureText(char).width;
  }

  /**
   * Check if font is monospace
   */
  private isMonospaceFont(fontFamily: string): boolean {
    const monospaceFonts = [
      'jetbrains mono',
      'fira code',
      'sf mono',
      'monaco',
      'consolas',
      'courier',
      'menlo',
      'source code pro'
    ];

    return monospaceFonts.some(mono => 
      fontFamily.toLowerCase().includes(mono)
    );
  }

  /**
   * Determine if glyph should be cached
   */
  private shouldCacheGlyph(char: string): boolean {
    // Cache ASCII and common Unicode characters
    const code = char.codePointAt(0) || 0;
    
    // ASCII range
    if (code >= 32 && code <= 126) return true;
    
    // Common Unicode blocks
    if (code >= 0x00A0 && code <= 0x00FF) return true; // Latin-1 Supplement
    if (code >= 0x2000 && code <= 0x206F) return true; // General Punctuation
    if (code >= 0x2500 && code <= 0x257F) return true; // Box Drawing
    
    return false;
  }

  /**
   * Clear surface
   */
  clearSurface(surfaceId: string): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return;

    surface.context.clearRect(0, 0, surface.width, surface.height);
  }

  /**
   * Render ASCII art with perfect alignment
   */
  renderASCIIArt(
    surfaceId: string,
    asciiArt: string[],
    x: number,
    y: number,
    config: RenderConfig
  ): void {
    const { font } = config;
    let currentY = y;

    for (const line of asciiArt) {
      this.renderText(surfaceId, line, x, currentY, config);
      currentY += font.lineHeight;
    }
  }

  /**
   * Render with color codes (ANSI support)
   */
  renderWithColors(
    surfaceId: string,
    text: string,
    x: number,
    y: number,
    baseConfig: RenderConfig
  ): void {
    const colorCodes = {
      '\\033[30m': '#000000', // Black
      '\\033[31m': '#ff4444', // Red
      '\\033[32m': '#00ff88', // Green
      '\\033[33m': '#ffaa00', // Yellow
      '\\033[34m': '#0088ff', // Blue
      '\\033[35m': '#8844ff', // Magenta
      '\\033[36m': '#00ffff', // Cyan
      '\\033[37m': '#ffffff', // White
      '\\033[0m': baseConfig.color, // Reset
    };

    let currentColor = baseConfig.color;
    let currentX = x;
    let processedText = text;

    // Process color codes
    for (const [code, color] of Object.entries(colorCodes)) {
      processedText = processedText.replace(
        new RegExp(code.replace(/\\/g, '\\\\'), 'g'),
        `|COLOR:${color}|`
      );
    }

    // Render with color changes
    const parts = processedText.split('|COLOR:');
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i > 0) {
        // Extract color and text
        const colorEndIndex = part.indexOf('|');
        if (colorEndIndex > 0) {
          currentColor = part.substring(0, colorEndIndex);
          const textPart = part.substring(colorEndIndex + 1);
          
          if (textPart) {
            this.renderText(surfaceId, textPart, currentX, y, {
              ...baseConfig,
              color: currentColor
            });
            currentX += textPart.length * baseConfig.font.charWidth;
          }
        }
      } else if (part) {
        // Regular text
        this.renderText(surfaceId, part, currentX, y, baseConfig);
        currentX += part.length * baseConfig.font.charWidth;
      }
    }
  }

  /**
   * Get surface canvas element
   */
  getSurfaceCanvas(surfaceId: string): HTMLCanvasElement | null {
    const surface = this.surfaces.get(surfaceId);
    return surface ? surface.canvas : null;
  }

  /**
   * Resize surface
   */
  resizeSurface(surfaceId: string, width: number, height: number): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return;

    const { canvas, context, pixelRatio } = surface;

    // Update canvas size
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Re-scale context
    context.scale(pixelRatio, pixelRatio);

    // Update surface properties
    surface.width = width;
    surface.height = height;
  }

  /**
   * Destroy surface and cleanup
   */
  destroySurface(surfaceId: string): void {
    const surface = this.surfaces.get(surfaceId);
    if (surface) {
      surface.canvas.remove();
      this.surfaces.delete(surfaceId);
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.fontMetricsCache.clear();
    this.glyphCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    fontMetrics: number;
    glyphs: number;
    surfaces: number;
  } {
    return {
      fontMetrics: this.fontMetricsCache.size,
      glyphs: this.glyphCache.size,
      surfaces: this.surfaces.size
    };
  }
}

/**
 * React Hook for ASCII Renderer Integration
 */
export function useASCIIRenderer() {
  const renderer = new ASCIIRenderer();

  return {
    createSurface: renderer.createSurface.bind(renderer),
    renderText: renderer.renderText.bind(renderer),
    renderASCIIArt: renderer.renderASCIIArt.bind(renderer),
    renderWithColors: renderer.renderWithColors.bind(renderer),
    clearSurface: renderer.clearSurface.bind(renderer),
    getSurfaceCanvas: renderer.getSurfaceCanvas.bind(renderer),
    resizeSurface: renderer.resizeSurface.bind(renderer),
    calculateFontMetrics: renderer.calculateFontMetrics.bind(renderer),
    getCacheStats: () => renderer.getCacheStats(),
  };
}