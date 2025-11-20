import type { Vector3 } from "./maths";

type Vertex = {
  position: Vector3;
  uv: [number, number];
  normal: Vector3;
};

class Mesh {
  public readonly label: string;

  public vertexBuffer!: GPUBuffer;
  public indexBuffer!: GPUBuffer;

  private initialised: boolean;

  private readonly rawVertices: Vertex[];
  private readonly rawIndices: number[];

  constructor(vertices: Vertex[], indices: number[], label: string = "") {
    this.rawVertices = vertices;
    this.rawIndices = indices;
    this.label = label;

    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    const vertices = new Float32Array(
      this.rawVertices
        .map(({ position, uv, normal }) => [...position, ...uv, ...normal])
        .flat()
    );

    const IndexBufferArray =
      this.indexFormat === "uint32" ? Uint32Array : Uint16Array;
    const indices = new IndexBufferArray(this.rawIndices);

    this.vertexBuffer = device.createBuffer({
      label: this.label + "Vertex Buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = device.createBuffer({
      label: this.label + "Index Buffer",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.initialised = true;
  }

  public render(renderPass: GPURenderPassEncoder): void {
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, this.indexFormat);
    renderPass.drawIndexed(this.indexCount);
  }

  public get indexFormat(): GPUIndexFormat {
    return this.rawIndices.length > 0xffff ? "uint32" : "uint16";
  }

  public get vertexCount(): number {
    return this.rawVertices.length;
  }

  public get indexCount(): number {
    return this.rawIndices.length;
  }
}

export { Mesh };
