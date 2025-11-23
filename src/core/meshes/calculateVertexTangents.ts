import { Vector2, Vector3 } from "../maths";
import type { Vertex } from "./VertexArray";

function calculateVertexTangents(
  vertices: Vertex[],
  indices?: number[]
): Vector3[] {
  const triangleCount = (indices?.length ?? vertices.length) / 3;

  const tangents: Vector3[] = new Array(vertices.length);

  for (let i = 0; i < triangleCount; i++) {
    const index0 = indices ? indices[3 * i + 0] : 3 * i + 0;
    const index1 = indices ? indices[3 * i + 1] : 3 * i + 1;
    const index2 = indices ? indices[3 * i + 2] : 3 * i + 2;

    const vertex0 = vertices[index0];
    const vertex1 = vertices[index1];
    const vertex2 = vertices[index2];

    const edge0 = Vector3.subtract(vertex1.position, vertex0.position);
    const edge1 = Vector3.subtract(vertex2.position, vertex0.position);

    const deltaUV0 = Vector2.subtract(vertex1.uv, vertex0.uv);
    const deltaUV1 = Vector2.subtract(vertex2.uv, vertex0.uv);

    const inverseDeterminant =
      1 / (deltaUV0.x * deltaUV1.y - deltaUV1.x * deltaUV0.y);
    const tangent = edge0
      .scale(deltaUV1.y)
      .subtract(edge1.scale(deltaUV0.y))
      .scale(inverseDeterminant);

    if (tangents[index0] === undefined) {
      tangents[index0] = tangent;
    } else {
      tangents[index0].add(tangent);
    }

    if (tangents[index1] === undefined) {
      tangents[index1] = tangent;
    } else {
      tangents[index1].add(tangent);
    }

    if (tangents[index2] === undefined) {
      tangents[index2] = tangent;
    } else {
      tangents[index2].add(tangent);
    }
  }

  return tangents;
}

export { calculateVertexTangents };
