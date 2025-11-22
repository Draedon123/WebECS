import { Component } from "src/ecs";

class Texture extends Component {
  public static readonly tag: string = "Texture";

  public texture!: GPUTexture;

  private readonly sources: GPUCopyExternalImageSource[];
  private readonly width: number;
  private readonly height: number;
  private readonly label?: string;

  constructor(
    sources: GPUCopyExternalImageSource[],
    width: number,
    height: number,
    label?: string
  ) {
    super(Texture.tag);

    this.sources = sources;
    this.width = width;
    this.height = height;
    this.label = label;
  }

  public get initialised(): boolean {
    return this.texture !== undefined;
  }

  public initialise(device: GPUDevice): void {
    this.texture = device.createTexture({
      label: this.label,
      size: [this.width, this.height],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST,
    });

    for (const source of this.sources) {
      device.queue.copyExternalImageToTexture(
        {
          source: source,
          flipY: true,
        },
        {
          texture: this.texture,
        },
        {
          width: this.width,
          height: this.height,
        }
      );
    }
  }

  public static async fetch(urls: string[], label?: string): Promise<Texture> {
    const bitmaps = await Texture.toBitmap(urls);

    return new Texture(bitmaps, bitmaps[0].width, bitmaps[0].height, label);
  }

  /** 0-255 */
  public static colour(
    r: number,
    g: number,
    b: number,
    a: number = 255,
    label?: string
  ): Texture {
    const imageData = new ImageData(new Uint8ClampedArray([r, g, b, a]), 1, 1);

    return new Texture([imageData], 1, 1, label);
  }

  public static createCubemap(
    textureDirectory: string,
    label?: string
  ): Promise<Texture> {
    return Texture.fetch(
      [
        `${textureDirectory}/px.png`,
        `${textureDirectory}/nx.png`,
        `${textureDirectory}/py.png`,
        `${textureDirectory}/ny.png`,
        `${textureDirectory}/pz.png`,
        `${textureDirectory}/nz.png`,
      ],
      label
    );
  }

  protected static toBitmap(urls: string[]): Promise<ImageBitmap[]> {
    const requests = urls.map(
      async (url) => await createImageBitmap(await (await fetch(url)).blob())
    );

    return Promise.all(requests);
  }
}

export { Texture };
