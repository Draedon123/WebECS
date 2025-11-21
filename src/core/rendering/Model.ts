import type { IndexArray, Mesh, VertexArray } from "../meshes";
import type { HasPosition, HasRotation, HasScale } from "../transforms";
import { Position, Rotation, Scale } from "../transforms";

class Model implements HasPosition, HasRotation, HasScale, Mesh {
  public vertices: VertexArray;
  public indices?: IndexArray | undefined;

  public position: Position;
  public rotation: Rotation;
  public scale: Scale;

  constructor(mesh: Mesh) {
    this.position = new Position();
    this.rotation = new Rotation();
    this.scale = new Scale();

    this.vertices = mesh.vertices;
    this.indices = mesh.indices;
  }
}

export { Model };
