import { Quaternion, Vector2, Vector3 } from "../maths";
import type { Vertex } from "./VertexArray";

function calculateVertexTangents(
  vertices: Vertex[],
  indices?: number[]
): Quaternion[] {
  const triangleCount = (indices?.length ?? vertices.length) / 3;

  const rawTangents: Vector3[] = new Array(vertices.length);
  const bitangents: Vector3[] = new Array(vertices.length);
  const tangents: Quaternion[] = new Array(vertices.length);

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

    const determinant = deltaUV0.x * deltaUV1.y - deltaUV1.x * deltaUV0.y;

    if (Math.abs(determinant) < 1e-8) {
      continue;
    }

    const inverseDeterminant = 1 / determinant;
    const tangent = Vector3.scale(edge0, deltaUV1.y)
      .subtract(Vector3.scale(edge1, deltaUV0.y))
      .scale(inverseDeterminant);

    const bitangent = Vector3.scale(edge1, deltaUV0.x)
      .subtract(Vector3.scale(edge1, deltaUV0.x))
      .scale(inverseDeterminant);

    if (!rawTangents[index0]) {
      rawTangents[index0] = tangent;
      bitangents[index0] = bitangent;
    } else {
      rawTangents[index0].add(tangent);
      // if the tangent is defined, the bitangent is guaranteed to also be defined
      bitangents[index0].add(bitangent);
    }

    if (!rawTangents[index1]) {
      rawTangents[index1] = tangent;
      bitangents[index1] = bitangent;
    } else {
      rawTangents[index1].add(tangent);
      bitangents[index1].add(bitangent);
    }

    if (!rawTangents[index2]) {
      rawTangents[index2] = tangent;
      bitangents[index2] = bitangent;
    } else {
      rawTangents[index2].add(tangent);
      bitangents[index2].add(bitangent);
    }
  }

  for (let i = 0, vertexCount = vertices.length; i < vertexCount; i++) {
    const normal = vertices[i].normal;
    let tangent = rawTangents[i];
    let bitangent = bitangents[i];

    // reconstruct tangent if missing
    if (tangent === undefined || tangent?.magnitude < 1e-6) {
      // if the tangent is missing, that meanst the vertex is only part of
      // degenerate triangles, which won't visibly be rendered
      // hence, it doesn't really matter what the tangent is
      tangent = Vector3.cross(
        normal,
        Math.abs(normal.x) > 0.5 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
      ).normalise();
      bitangent = Vector3.cross(normal, tangent);
    }

    const orthogonalised = Vector3.subtract(
      tangent,
      Vector3.scale(normal, Vector3.dot(normal, tangent))
    ).normalise();
    const handedness =
      Vector3.dot(Vector3.cross(normal, orthogonalised), bitangent) < 0
        ? -1
        : 1;

    tangents[i] = new Quaternion(
      orthogonalised.x,
      orthogonalised.y,
      orthogonalised.z,
      handedness
    );
  }

  return tangents;
}

export { calculateVertexTangents };
