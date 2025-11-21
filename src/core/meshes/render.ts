import type { IndexArray } from "./IndexArray";
import type { VertexArray } from "./VertexArray";

type UnindexedMesh = {
  vertices: VertexArray;
};

type IndexedMesh = UnindexedMesh & {
  indices: IndexArray;
};

type Mesh = UnindexedMesh & Partial<IndexedMesh>;

function render(mesh: Mesh, renderPass: GPURenderPassEncoder): void {
  renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);

  if (mesh.indices !== undefined) {
    renderPass.setIndexBuffer(
      mesh.indices.indexBuffer,
      mesh.indices.indexFormat
    );
    renderPass.drawIndexed(mesh.indices.indexCount, 1);
  } else {
    renderPass.draw(mesh.vertices.vertexCount, 1);
  }
}

export { render };
export type { UnindexedMesh, IndexedMesh, Mesh };
