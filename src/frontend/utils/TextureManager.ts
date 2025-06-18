import { TEXTURE_CONFIG } from '../config/textures';
import { TexturePack } from '../types/texturePack';

export interface TextureConfig {
  [tileType: string]: string;
}

export class TextureManager {
  private textures: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private currentPack: TexturePack | null = null;
  private defaultTextures: Record<string, string> = {};

  constructor(private textureConfig?: TextureConfig) {
    this.defaultTextures = TEXTURE_CONFIG;
  }

  async loadTexturePack(pack: TexturePack): Promise<void> {
    this.textures.clear();
    this.loadingPromises.clear();
    this.currentPack = pack;

    const combinedTextures: Record<string, string> = {};
    const requiredTextures = Object.keys(TEXTURE_CONFIG);

    for (const texture of requiredTextures) {
      combinedTextures[texture] = this.defaultTextures[texture];
    }

    Object.entries(pack.textures).forEach(([texture, path]) => {
      combinedTextures[texture] = path;
    });

    const loadPromises = Object.entries(combinedTextures).map(
      ([tileType, path]) => this.loadTexture(tileType, path)
    );

    await Promise.allSettled(loadPromises);
  }

  async loadAllTextures(): Promise<void> {
    if (!this.textureConfig) {
      throw new Error(
        'No texture configuration provided. Use loadTexturePack instead.'
      );
    }

    const loadPromises = Object.entries(this.textureConfig).map(
      ([tileType, path]) => this.loadTexture(tileType, path)
    );

    await Promise.allSettled(loadPromises);
  }

  private async loadTexture(
    tileType: string,
    path: string
  ): Promise<HTMLImageElement> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(tileType);
    if (existingPromise) {
      return existingPromise;
    }

    // Check if already loaded
    const existingTexture = this.textures.get(tileType);
    if (existingTexture) {
      return existingTexture;
    }

    // Create loading promise
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = path;

      img.onload = () => {
        this.textures.set(tileType, img);
        this.loadingPromises.delete(tileType);
        resolve(img);
      };

      img.onerror = () => {
        console.error(`Failed to load texture for ${tileType}: ${path}`);
        this.loadingPromises.delete(tileType);

        // If this was a pack texture that failed, try loading the default
        if (this.currentPack && path !== this.defaultTextures[tileType]) {
          const defaultPath = this.defaultTextures[tileType];
          if (defaultPath) {
            console.warn(
              `Falling back to default texture for ${tileType}: ${defaultPath}`
            );
            this.loadTexture(tileType, defaultPath).then(resolve).catch(reject);
            return;
          }
        }

        reject(new Error(`Failed to load texture: ${path}`));
      };
    });

    this.loadingPromises.set(tileType, loadPromise);
    return loadPromise;
  }

  getTexture(tileType: string): HTMLImageElement | null {
    return this.textures.get(tileType) || null;
  }

  hasTexture(tileType: string): boolean {
    return this.textures.has(tileType);
  }

  getLoadedCount(): number {
    return this.textures.size;
  }

  getTotalCount(): number {
    return Object.keys(TEXTURE_CONFIG).length;
  }

  getLoadingProgress(): number {
    const total = this.getTotalCount();
    if (total === 0) return 100;
    return (this.getLoadedCount() / total) * 100;
  }

  isFullyLoaded(): boolean {
    return this.getLoadedCount() >= Object.keys(TEXTURE_CONFIG).length;
  }

  getCurrentPack(): TexturePack | null {
    return this.currentPack;
  }
}
