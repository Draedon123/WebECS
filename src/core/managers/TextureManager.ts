import { Texture } from "../rendering";

class TextureManager {
  public static readonly DEFAULT_TEXTURE_KEY: string = "default";

  private readonly textures: Map<string, Texture>;
  private readonly device: GPUDevice;

  constructor(device: GPUDevice) {
    this.textures = new Map();
    this.device = device;

    const defaultTexture = Texture.colour(255, 255, 255);
    defaultTexture.initialise(device);
    this.add(TextureManager.DEFAULT_TEXTURE_KEY, defaultTexture);
  }

  public add(key: string, texture: Texture): void {
    this.get(key)?.destroy();
    texture.initialise(this.device);
    this.textures.set(key, texture);
  }

  public get(key: string): Texture | null {
    return this.textures.get(key) ?? null;
  }

  public delete(key: string): boolean {
    const texture = this.get(key);

    if (texture === null) {
      return false;
    }

    texture.destroy();
    this.textures.delete(key);

    return true;
  }
}

export { TextureManager };
