import type { IndexArray } from "./IndexArray";
import type { VertexArray } from "./VertexArray";

type UnindexedMesh = {
  vertices: VertexArray;
};

type IndexedMesh = UnindexedMesh & {
  indices: IndexArray;
};

function render(
  mesh: UnindexedMesh | IndexedMesh,
  renderPass: GPURenderPassEncoder
): void {
  renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);

  if ("indices" in mesh) {
    renderPass.setIndexBuffer(
      mesh.indices.indexBuffer,
      mesh.indices.indexFormat
    );
    renderPass.drawIndexed(mesh.indices.indexCount, 1);
  } else {
    renderPass.draw(mesh.vertices.vertexCount, 1);
  }
}

export { render, type UnindexedMesh, type IndexedMesh };
