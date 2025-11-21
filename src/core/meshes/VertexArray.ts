import { Component } from "src/ecs";
import type { Vector2, Vector3 } from "../maths";

type Vertex = {
  position: Vector3;
  uv: Vector2;
  normal: Vector3;
};

class VertexArray extends Component {
  public static readonly tag: string = "VertexArray";

  public readonly label: string;
  public vertexBuffer!: GPUBuffer;
  private readonly rawVertices: Vertex[];

  constructor(vertices: Vertex[], label: string = "") {
    super(VertexArray.tag);

    this.rawVertices = vertices;
    this.label = label;
  }

  public get initialised(): boolean {
    return this.vertexBuffer !== undefined;
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
      label: `${this.label} Vertex Buffer`,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  public get vertexCount(): number {
    return this.rawVertices.length;
  }
}

export { VertexArray, type Vertex };
