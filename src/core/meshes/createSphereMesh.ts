import { Vector2, Vector3 } from "../maths";
import { createCubeMesh } from "./createCubeMesh";
import type { Vertex } from "./VertexArray";

function createSphereMesh(
  resolution: number,
  radius: number = 1
): { vertices: Vertex[]; indices: number[] } {
  const cube = createCubeMesh(radius * 2, resolution);

  cube.vertices.forEach((vertex) => {
    vertex.position.normalise().scale(radius);

    const normal = Vector3.normalise(vertex.position);

    // uniformly distribute points
    normal.x *= Math.sqrt(
      1 -
        0.5 * normal.y * normal.y -
        0.5 * normal.z * normal.z +
        (normal.y * normal.y * normal.z * normal.z) / 3
    );
    normal.y *= Math.sqrt(
      1 -
        0.5 * normal.x * normal.x -
        0.5 * normal.z * normal.z +
        (normal.x * normal.x * normal.z * normal.z) / 3
    );
    normal.z *= Math.sqrt(
      1 -
        0.5 * normal.y * normal.y -
        0.5 * normal.x * normal.x +
        (normal.y * normal.y * normal.x * normal.x) / 3
    );

    vertex.normal = normal.normalise();

    const longitude = Math.atan2(normal.x, normal.z);
    const latitude = Math.asin(normal.y);

    const u = (longitude + Math.PI) / (2 * Math.PI);
    const v = (latitude + Math.PI / 2) / Math.PI;

    vertex.uv = new Vector2(u, v);
  });

  return cube;
}

export { createSphereMesh };
