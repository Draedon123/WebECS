import { roundUp } from "../maths";
import { calculateVertexTangents } from "./calculateVertexTangents";
import type { IndexArray } from "./IndexArray";
import type { VertexArray } from "./VertexArray";

function initialiseMesh(
  device: GPUDevice,
  vertexArray: VertexArray,
  indexArray?: IndexArray
): void {
  if (
    vertexArray.initialised &&
    (indexArray === undefined || indexArray?.initialised)
  ) {
    return;
  }

  const tangents = calculateVertexTangents(
    vertexArray.rawVertices,
    indexArray?.rawIndices
  );

  if (indexArray !== undefined && !indexArray.initialised) {
    const IndexBufferArray =
      indexArray.indexFormat === "uint32" ? Uint32Array : Uint16Array;
    const indices = new IndexBufferArray(
      // data written to buffer must be a multiple of 4 bytes
      // that means if the index format is uint16 and there are an odd number
      // of indices, it won't be a multiple of 4
      indexArray.indexFormat === "uint16"
        ? roundUp(indexArray.rawIndices.length, 2)
        : indexArray.rawIndices.length
    );
    indices.set(indexArray.rawIndices);

    indexArray.indexBuffer = device.createBuffer({
      label: `${indexArray.label} Index Buffer`,
      size: roundUp(indices.byteLength, 4),
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(indexArray.indexBuffer, 0, indices);
  }

  if (!vertexArray.initialised) {
    const vertices = new Float32Array(
      vertexArray.rawVertices.length * (3 + 2 + 3 + 4)
    );

    for (
      let i = 0, vertexCount = vertexArray.rawVertices.length;
      i < vertexCount;
      i++
    ) {
      const offset = i * (3 + 2 + 3 + 4);
      const vertex = vertexArray.rawVertices[i];
      const tangent = tangents[i];

      vertices[offset + 0] = vertex.position.x;
      vertices[offset + 1] = vertex.position.y;
      vertices[offset + 2] = vertex.position.z;
      vertices[offset + 3] = vertex.uv.x;
      vertices[offset + 4] = vertex.uv.y;
      vertices[offset + 5] = vertex.normal.x;
      vertices[offset + 6] = vertex.normal.y;
      vertices[offset + 7] = vertex.normal.z;
      vertices[offset + 8] = tangent.x;
      vertices[offset + 9] = tangent.y;
      vertices[offset + 10] = tangent.z;
      vertices[offset + 11] = tangent.w;
    }

    vertexArray.vertexBuffer = device.createBuffer({
      label: `${vertexArray.label} Vertex Buffer`,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexArray.vertexBuffer, 0, vertices);
  }
}

export { initialiseMesh };
