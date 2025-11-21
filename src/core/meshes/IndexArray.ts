import { Component } from "src/ecs";

class IndexArray extends Component {
  public static readonly tag: string = "IndexArray";

  public readonly label: string;
  public indexBuffer!: GPUBuffer;
  private initialised: boolean;
  private readonly rawIndices: number[];

  constructor(indices: number[], label: string = "") {
    super(IndexArray.tag);

    this.rawIndices = indices;
    this.label = label;

    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    const IndexBufferArray =
      this.indexFormat === "uint32" ? Uint32Array : Uint16Array;
    const indices = new IndexBufferArray(this.rawIndices);

    this.indexBuffer = device.createBuffer({
      label: `${this.label} Index Buffer`,
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.initialised = true;
  }

  public get indexFormat(): GPUIndexFormat {
    return this.rawIndices.length > 0xffff ? "uint32" : "uint16";
  }

  public get indexCount(): number {
    return this.rawIndices.length;
  }
}

export { IndexArray };
