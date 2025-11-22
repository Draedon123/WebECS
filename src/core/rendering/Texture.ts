import { Component } from "src/ecs";

class Texture extends Component {
  public static readonly tag: string = "Texture";

  public texture!: GPUTexture;

  private readonly source: GPUCopyExternalImageSource;
  private readonly width: number;
  private readonly height: number;
  private readonly label?: string;

  constructor(
    source: GPUCopyExternalImageSource,
    width: number,
    height: number,
    label?: string
  ) {
    super(Texture.tag);

    this.source = source;
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

    device.queue.copyExternalImageToTexture(
      {
        source: this.source,
        flipY: true,
      },
      {
        texture: this.texture,
        origin: [0, 0],
      },
      {
        width: this.width,
        height: this.height,
      }
    );
  }

  public static async fetch(url: string, label?: string): Promise<Texture> {
    const data = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(data);

    return new Texture(bitmap, bitmap.width, bitmap.height, label);
  }

  /** 0-255 */
  public static colour(
    r: number,
    g: number,
    b: number,
    a: number = 255,
    label?: string
  ): Texture {
    const bitmap = new ImageData(new Uint8ClampedArray([r, g, b, a]), 1, 1);

    return new Texture(bitmap, 1, 1, label);
  }
}

export { Texture };
