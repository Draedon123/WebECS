import { Component } from "src/ecs";
import EquirectangularWorker from "./equirectangularWorker?worker";
import type { DataIn, DataOut } from "./equirectangularWorker";

type EquirectangularSettings = {
  interpolation: "nearest" | "bilinear" | `lanczos${number}`;
  /** degrees */
  horizontalRotation: number;
  /** degrees */
  verticalRotation: number;
};

class Texture extends Component {
  public static readonly tag: string = "Texture";
  public static readonly WHITE: Texture = Texture.colour(255, 255, 255);

  public texture!: GPUTexture;

  public readonly label?: string;
  private readonly sources: GPUCopyExternalImageSource[];
  private readonly width: number;
  private readonly height: number;

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
      size: [this.width, this.height, this.sources.length],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST,
    });

    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];

      device.queue.copyExternalImageToTexture(
        {
          source: source,
          flipY: true,
        },
        {
          texture: this.texture,
          origin: [0, 0, i],
        },
        {
          width: this.width,
          height: this.height,
        }
      );
    }
  }

  public destroy(): void {
    this.texture?.destroy();
    this.sources.length = 0;
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

  public static async equirectangularToCubemap(
    url: string,
    settings: Partial<EquirectangularSettings> = {},
    label?: string
  ): Promise<Texture> {
    const image = await new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = url;
    });

    if (image.width !== image.height * 2) {
      throw new Error("Image width must be twice its height (2:1)");
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return new Promise<Texture>((resolve) => {
      const worker = new EquirectangularWorker({
        name: (label ?? "Texture") + " Equirectangular to Cubemap Worker",
      });

      const actualSettings: EquirectangularSettings = {
        interpolation: settings.interpolation ?? "bilinear",
        horizontalRotation: settings.horizontalRotation ?? 0,
        verticalRotation: settings.verticalRotation ?? 0,
      };
      const startTime = performance.now();

      worker.onmessage = (event: MessageEvent<DataOut>) => {
        const endTime = performance.now();
        const elapsed_ms = endTime - startTime;

        console.debug(
          `Took ${elapsed_ms.toFixed(2)}ms to convert equirectangular projected panorama to cubemap.\nImage dimensions: ${image.width}x${image.height}\nInterpolation algorithm: ${actualSettings.interpolation}`
        );

        const texture = new Texture(
          event.data.faces,
          event.data.faceDimensions,
          event.data.faceDimensions,
          label
        );

        worker.terminate();

        resolve(texture);
      };

      worker.postMessage({
        image: imageData,
        settings: actualSettings,
      } satisfies DataIn);
    });
  }

  protected static toBitmap(urls: string[]): Promise<ImageBitmap[]> {
    const requests = urls.map(
      async (url) => await createImageBitmap(await (await fetch(url)).blob())
    );

    return Promise.all(requests);
  }
}

export { Texture };
export type { EquirectangularSettings };
