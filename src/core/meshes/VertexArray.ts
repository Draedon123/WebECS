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

    const vertices = new Float32Array(this.rawVertices.length * (3 + 2 + 3));

    for (
      let i = 0, vertexCount = this.rawVertices.length;
      i < vertexCount;
      i++
    ) {
      const offset = i * (3 + 2 + 3);
      const vertex = this.rawVertices[i];

      vertices[offset + 0] = vertex.position.x;
      vertices[offset + 1] = vertex.position.y;
      vertices[offset + 2] = vertex.position.z;
      vertices[offset + 3] = vertex.uv.x;
      vertices[offset + 4] = vertex.uv.y;
      vertices[offset + 5] = vertex.normal.x;
      vertices[offset + 6] = vertex.normal.y;
      vertices[offset + 7] = vertex.normal.z;
    }

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
