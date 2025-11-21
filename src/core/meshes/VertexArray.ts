import type { Vector3 } from "../maths";

type Vertex = {
  position: Vector3;
  uv: [number, number];
  normal: Vector3;
};

class VertexArray {
  public readonly label: string;

  public vertexBuffer!: GPUBuffer;

  private initialised: boolean;

  private readonly rawVertices: Vertex[];

  constructor(vertices: Vertex[], label: string = "") {
    this.rawVertices = vertices;
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

    this.vertexBuffer = device.createBuffer({
      label: this.label + "Vertex Buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    this.initialised = true;
  }

  public get vertexCount(): number {
    return this.rawVertices.length;
  }
}

export { VertexArray };
