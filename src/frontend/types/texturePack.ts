export interface TexturePack {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  textures: Record<string, string>;
}

export interface TexturePackManifest {
  name: string;
  description?: string;
  author?: string;
  version?: string;
}

export interface TexturePackScanResult {
  available: TexturePack[];
  default: string;
}
