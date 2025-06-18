import {
  TexturePack,
  TexturePackManifest,
  TexturePackScanResult,
} from '../types/texturePack';
import { TEXTURE_CONFIG } from '../config/textures';

export class TexturePackScanner {
  private static readonly RESOURCES_PATH = '/resources';
  private static readonly DEFAULT_PACK_ID = 'default';

  private static readonly DEFAULT_PACKS = ['mse'];

  static async scanTexturePacks(): Promise<TexturePackScanResult> {
    const availablePacks: TexturePack[] = [];

    const defaultPack = await this.loadDefaultTexturePack();
    availablePacks.push(defaultPack);

    for (const packName of this.DEFAULT_PACKS) {
      try {
        const pack = await this.tryLoadTexturePack(packName);
        if (pack) {
          availablePacks.push(pack);
        }
      } catch (error) {
        console.debug(
          `Default pack '${packName}' not found or could not be loaded`
        );
      }
    }

    return {
      available: availablePacks,
      default: this.DEFAULT_PACK_ID,
    };
  }

  static async loadTexturePackByName(
    packName: string
  ): Promise<TexturePack | null> {
    if (!packName || packName.trim() === '') {
      return null;
    }

    const sanitizedName = packName.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedName !== packName.trim()) {
      throw new Error(
        'Pack name contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.'
      );
    }

    return await this.tryLoadTexturePack(sanitizedName);
  }

  private static async loadDefaultTexturePack(): Promise<TexturePack> {
    return {
      id: this.DEFAULT_PACK_ID,
      name: 'Default Textures',
      description: 'The original texture pack',
      textures: TEXTURE_CONFIG,
    };
  }

  private static async tryLoadTexturePack(
    packName: string
  ): Promise<TexturePack | null> {
    const packPath = `${this.RESOURCES_PATH}/${packName}`;

    let manifest: TexturePackManifest;
    try {
      const manifestResponse = await fetch(`${packPath}/manifest.json`);
      if (!manifestResponse.ok) {
        manifest = {
          name: packName.charAt(0).toUpperCase() + packName.slice(1) + ' Pack',
        };
      } else {
        manifest = await manifestResponse.json();
      }
    } catch {
      manifest = {
        name: packName.charAt(0).toUpperCase() + packName.slice(1) + ' Pack',
      };
    }

    const textures: Record<string, string> = {};
    const requiredTextures = Object.keys(TEXTURE_CONFIG);
    const texturePromises = requiredTextures.map(async (texture) => {
      const texturePath = `${packPath}/${texture}.png`;
      try {
        const response = await fetch(texturePath, { method: 'HEAD' });
        if (response.ok) {
          textures[texture] = texturePath;
          return { texture, found: true };
        }
        return { texture, found: false };
      } catch {
        return { texture, found: false };
      }
    });

    const results = await Promise.all(texturePromises);
    const foundTextures = results.filter((result) => result.found).length;

    if (foundTextures === 0) {
      return null;
    }

    const missingTextures = results
      .filter((result) => !result.found)
      .map((result) => result.texture);

    let description = manifest.description || '';
    if (missingTextures.length > 0) {
      const missingText = `Missing textures (will use defaults): ${missingTextures.join(', ')}`;
      description = description
        ? `${description}. ${missingText}`
        : missingText;
    }

    return {
      id: packName,
      name: manifest.name,
      description,
      author: manifest.author,
      version: manifest.version,
      textures,
    };
  }

  static validateTexturePack(pack: TexturePack): boolean {
    return Object.keys(pack.textures).length > 0;
  }
}
