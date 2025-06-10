export interface TextureConfig {
  [tileType: string]: string;
}

export class TextureManager {
  private textures: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  constructor(private textureConfig: TextureConfig) {}

  async loadAllTextures(): Promise<void> {
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
    return Object.keys(this.textureConfig).length;
  }

  getLoadingProgress(): number {
    const total = this.getTotalCount();
    if (total === 0) return 100;
    return (this.getLoadedCount() / total) * 100;
  }

  isFullyLoaded(): boolean {
    return this.getLoadedCount() === this.getTotalCount();
  }
}
