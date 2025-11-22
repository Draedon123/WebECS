import { Component } from "src/ecs";
import { roundUp } from "../maths";

class IndexArray extends Component {
  public static readonly tag: string = "IndexArray";

  public readonly label: string;
  public indexBuffer!: GPUBuffer;
  private readonly rawIndices: number[];
  public readonly indexFormat: GPUIndexFormat;

  constructor(indices: number[], label: string = "") {
    super(IndexArray.tag);

    this.rawIndices = indices;
    this.indexFormat = IndexArray.getIndexFormat(indices);
    this.label = label;
  }

  public get initialised(): boolean {
    return this.indexBuffer !== undefined;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    const IndexBufferArray =
      this.indexFormat === "uint32" ? Uint32Array : Uint16Array;
    const indices = new IndexBufferArray(
      // data written to buffer must be a multiple of 4 bytes
      // that means if the index format is uint16 and there are an odd number
      // of indices, it won't be a multiple of 4
      this.indexFormat === "uint16"
        ? roundUp(this.rawIndices.length, 2)
        : this.rawIndices.length
    );
    indices.set(this.rawIndices);

    this.indexBuffer = device.createBuffer({
      label: `${this.label} Index Buffer`,
      size: roundUp(indices.byteLength, 4),
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.indexBuffer, 0, indices);
  }

  private static getIndexFormat(indices: number[]): GPUIndexFormat {
    return Math.max(...indices) > 0xffff ? "uint32" : "uint16";
  }

  public get indexCount(): number {
    return this.rawIndices.length;
  }
}

export { IndexArray };
