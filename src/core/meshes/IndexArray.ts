import { Component } from "src/ecs";

class IndexArray extends Component {
  public static readonly tag: string = "IndexArray";

  public readonly label: string;
  public readonly rawIndices: number[];
  public indexBuffer!: GPUBuffer;
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

  private static getIndexFormat(indices: number[]): GPUIndexFormat {
    const maxIndex = indices.reduce(
      (max, current) => (current > max ? current : max),
      0
    );
    return maxIndex > 0xffff ? "uint32" : "uint16";
  }

  public get indexCount(): number {
    return this.rawIndices.length;
  }
}

export { IndexArray };
