import { Component } from "src/ecs";
import { Quaternion, Vector3 } from "../maths";

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
    interpolation: "nearest" | "bilinear",
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

    const faceDimensions = imageData.width / 4;
    const faces = Array.from(
      { length: 6 },
      () => new ImageData(faceDimensions, faceDimensions)
    );

    const interpolate =
      interpolation === "nearest"
        ? Texture.sampleNearest
        : Texture.bilinearInterpolate;
    for (let i = 0; i < 6; i++) {
      const face = faces[i];

      for (let k = 0; k < faceDimensions; k++) {
        for (let j = 0; j < faceDimensions; j++) {
          // [-1, 1)
          const u = 2 * (j / faceDimensions - 0.5);
          const v = 2 * (k / faceDimensions - 0.5);

          const point = getPointOnCube(i, u, v);

          const phi = Math.asin(point.y / Math.hypot(u, v, 1));
          const theta = Math.atan2(point.x, point.z);

          const x = image.width * (0.5 + theta / (2 * Math.PI));
          const y = image.height * (0.5 + phi / Math.PI);

          const pixel = interpolate(x, y, imageData);
          const offset = 4 * (j + faceDimensions * k);

          face.data[offset + 0] = pixel[0];
          face.data[offset + 1] = pixel[1];
          face.data[offset + 2] = pixel[2];
          face.data[offset + 3] = pixel[3];
        }
      }
    }

    return new Texture(faces, faceDimensions, faceDimensions, label);
  }

  private static sampleNearest(
    x: number,
    y: number,
    image: ImageData
  ): number[] {
    const offset = 4 * (Math.round(x) + Math.round(y) * image.width);

    return [
      image.data[offset + 0],
      image.data[offset + 1],
      image.data[offset + 2],
      image.data[offset + 3],
    ];
  }

  // https://en.wikipedia.org/wiki/Bilinear_interpolation
  private static bilinearInterpolate(
    x: number,
    y: number,
    image: ImageData
  ): number[] {
    const x1 = Math.floor(x);
    const x2 = x1 + 1;
    const y1 = Math.floor(y);
    const y2 = y1 + 1;

    const q11Offset = 4 * (x1 + image.width * y1);
    const q12Offset = 4 * (x1 + image.width * y2);
    const q21Offset = 4 * (x2 + image.width * y1);
    const q22Offset = 4 * (x2 + image.width * y2);

    const q11 = new Quaternion(
      image.data[q11Offset + 0],
      image.data[q11Offset + 1],
      image.data[q11Offset + 2],
      image.data[q11Offset + 3]
    );

    const q12 = new Quaternion(
      image.data[q12Offset + 0],
      image.data[q12Offset + 1],
      image.data[q12Offset + 2],
      image.data[q12Offset + 3]
    );

    const q21 = new Quaternion(
      image.data[q21Offset + 0],
      image.data[q21Offset + 1],
      image.data[q21Offset + 2],
      image.data[q21Offset + 3]
    );

    const q22 = new Quaternion(
      image.data[q22Offset + 0],
      image.data[q22Offset + 1],
      image.data[q22Offset + 2],
      image.data[q22Offset + 3]
    );

    const result = q11
      .scale((x2 - x) * (y2 - y))
      .add(q12.scale((x2 - x) * (y - y1)))
      .add(q21.scale((x - x1) * (y2 - y)))
      .add(q22.scale((x - x1) * (y - y1)))
      .scale(1 / ((x2 - x1) * (y2 - y1)));

    return [result.x, result.y, result.z, result.w];
  }

  protected static toBitmap(urls: string[]): Promise<ImageBitmap[]> {
    const requests = urls.map(
      async (url) => await createImageBitmap(await (await fetch(url)).blob())
    );

    return Promise.all(requests);
  }
}

function getPointOnCube(face: number, u: number, v: number): Vector3 {
  switch (face) {
    // right
    case 0:
      return new Vector3(1, v, -u);
    // left
    case 1:
      return new Vector3(-1, v, u);
    // top
    case 2:
      return new Vector3(v, 1, u);
    // bottom
    case 3:
      return new Vector3(v, -1, -u);
    // back
    case 4:
      return new Vector3(u, v, 1);
    // front
    case 5:
      return new Vector3(-u, v, -1);
    default:
      throw new Error(
        `Face must be between 0 and 5 inclusive. Received ${face}`
      );
  }
}

export { Texture };
