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
  public readonly rawVertices: Vertex[];
  public vertexBuffer!: GPUBuffer;

  constructor(vertices: Vertex[], label: string = "") {
    super(VertexArray.tag);

    this.rawVertices = vertices;
    this.label = label;
  }

  public get initialised(): boolean {
    return this.vertexBuffer !== undefined;
  }

  public get vertexCount(): number {
    return this.rawVertices.length;
  }

  public destroy(): void {
    this.rawVertices.length = 0;
    this.vertexBuffer?.destroy();
  }
}

export { VertexArray, type Vertex };
