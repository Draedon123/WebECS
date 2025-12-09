import { Texture, type Renderer } from "./rendering";

class TextureManager {
  public static readonly DEFAULT_TEXTURE_KEY: string = "default";

  private readonly textures: Map<string, Texture>;
  private readonly textureBindGroups: Map<string, GPUBindGroup>;
  private readonly textureToBindGroupsMap: Map<Texture, string[]>;

  private readonly device: GPUDevice;
  private readonly renderer: Renderer;

  constructor(renderer: Renderer, device: GPUDevice) {
    this.textures = new Map();
    this.textureBindGroups = new Map();
    this.textureToBindGroupsMap = new Map();

    this.renderer = renderer;
    this.device = device;

    const defaultTexture = Texture.colour(255, 255, 255);
    defaultTexture.initialise(device);
    this.addTexture(TextureManager.DEFAULT_TEXTURE_KEY, defaultTexture);
  }

  public addTexture(key: string, texture: Texture): void {
    this.getTexture(key)?.destroy();
    texture.initialise(this.device);
    this.textures.set(key, texture);
  }

  public getTexture(key: string): Texture | null {
    return this.textures.get(key) ?? null;
  }

  public deleteTexture(key: string): boolean {
    const texture = this.getTexture(key);

    if (texture === null) {
      return false;
    }

    texture.destroy();
    this.textures.delete(key);
    const bindGroups = this.textureToBindGroupsMap.get(texture) as string[];

    for (const key of bindGroups) {
      this.textureBindGroups.delete(key);
    }

    return true;
  }

  public getTextureBindGroup(
    texture?: Texture,
    normalMap?: Texture
  ): GPUBindGroup {
    const key = this.getTextureBindGroupsKey(texture, normalMap);
    const existingBindGroup = this.textureBindGroups.get(key);

    if (existingBindGroup) {
      return existingBindGroup;
    }

    const bindGroup = this.createTextureBindGroup(
      // default texture is guaranteed to be defined
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      texture ?? this.getTexture(TextureManager.DEFAULT_TEXTURE_KEY)!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      normalMap ?? this.getTexture(TextureManager.DEFAULT_TEXTURE_KEY)!
    );

    this.textureBindGroups.set(key, bindGroup);

    if (texture) {
      const textureBindGroups = this.textureToBindGroupsMap.get(texture) ?? [];
      textureBindGroups.push(key);
      this.textureToBindGroupsMap.set(texture, textureBindGroups);
    }

    if (normalMap) {
      const textureBindGroups =
        this.textureToBindGroupsMap.get(normalMap) ?? [];
      textureBindGroups.push(key);
      this.textureToBindGroupsMap.set(normalMap, textureBindGroups);
    }

    return bindGroup;
  }

  private createTextureBindGroup(
    texture: Texture,
    normalMap: Texture
  ): GPUBindGroup {
    return this.device.createBindGroup({
      label: `Texture Bind Group. Texture: ${texture.label}. Normal Map: ${normalMap.label}`,
      layout: this.renderer.texureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: texture.texture.createView(),
        },
        {
          binding: 1,
          resource: normalMap.texture.createView(),
        },
      ],
    });
  }

  private getTextureBindGroupsKey(
    texture?: Texture,
    normalMap?: Texture
  ): string {
    return `${texture?.id ?? -1},${normalMap?.id ?? -1}`;
  }
}

export { TextureManager };
