import { EntityManager } from "src/ecs";
import { IndexArray } from "./IndexArray";
import { VertexArray } from "./VertexArray";
import { Position, Rotation, Scale } from "../transforms";

function render(device: GPUDevice, renderPass: GPURenderPassEncoder): void {
  const entityManager = EntityManager.getInstance();
  const renderables = entityManager.queryMultiple({
    type: "intersection",
    queries: [
      {
        type: "singleMatch",
        component: VertexArray,
      },
      {
        type: "union",
        components: [Position, Rotation, Scale],
      },
    ],
  });

  for (const entity of renderables) {
    const vertexArray = entityManager.getComponent(
      entity,
      "VertexArray"
    ) as VertexArray;
    const indexArray = entityManager.getComponent<IndexArray>(
      entity,
      "IndexArray"
    );

    if (!vertexArray.initialised) {
      vertexArray.initialise(device);
    }

    renderPass.setVertexBuffer(0, vertexArray.vertexBuffer);

    if (indexArray !== null) {
      if (!indexArray.initialised) {
        indexArray.initialise(device);
      }

      renderPass.setIndexBuffer(indexArray.indexBuffer, indexArray.indexFormat);
      renderPass.drawIndexed(indexArray.indexCount, 1);
    } else {
      renderPass.draw(vertexArray.vertexCount, 1);
    }
  }
}

export { render };
