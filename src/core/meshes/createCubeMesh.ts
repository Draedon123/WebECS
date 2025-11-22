import { Vector2, Vector3 } from "../maths";
import { type Vertex } from "./VertexArray";

function createCubeMesh(
  sideLength: number = 1,
  resolution: number = 1
): { vertices: Vertex[]; indices: number[] } {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  const directions = [
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
  ];

  for (let i = 0; i < directions.length; i++) {
    const direction = directions[i];

    const face = createCubeFace(
      direction,
      i * (resolution + 1) * (resolution + 1),
      resolution,
      sideLength
    );

    for (const vertex of face.vertices) {
      vertices.push(vertex);
    }

    for (const index of face.indices) {
      indices.push(index);
    }
  }

  return {
    vertices: vertices,
    indices: indices,
  };
}

function createCubeFace(
  direction: Vector3,
  indexOffset: number,
  resolution: number,
  sideLength: number
): { vertices: Vertex[]; indices: number[] } {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  const u = new Vector3(direction.y, direction.z, direction.x).scale(
    sideLength
  );
  const v = Vector3.cross(direction, u).normalise().scale(sideLength);
  const corner = Vector3.subtract(
    Vector3.scale(direction, 0.5 * sideLength),
    Vector3.add(u, v).scale(0.5)
  );

  const du = Vector3.scale(u, 1 / resolution);
  const dv = Vector3.scale(v, 1 / resolution);

  for (let u = 0; u <= resolution; u++) {
    for (let v = 0; v <= resolution; v++) {
      const offset = Vector3.scale(du, u).add(Vector3.scale(dv, v));
      const position = Vector3.add(corner, offset);

      vertices.push({
        position,
        uv: new Vector2(u / resolution, v / resolution),
        normal: direction,
      });

      if (u < resolution && v < resolution) {
        const currentIndex = indexOffset + u + v * (resolution + 1);

        indices.push(
          currentIndex,
          currentIndex + 1,
          currentIndex + resolution + 2,
          currentIndex,
          currentIndex + resolution + 2,
          currentIndex + resolution + 1
        );
      }
    }
  }

  return { vertices, indices };
}

export { createCubeMesh };
