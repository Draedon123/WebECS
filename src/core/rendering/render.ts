import { EntityManager } from "src/ecs";
import { IndexArray } from "../meshes";
import { VertexArray } from "../meshes";
import { calculateModelMatrix, Position, Rotation, Scale } from "../transforms";
import { BindGroup, Buffer } from "../gpu";

function render(device: GPUDevice, renderPass: GPURenderPassEncoder): void {
  const entityManager = EntityManager.getInstance();
  const renderables = entityManager.queryMultiple({
    type: "intersection",
    queries: [
      {
        type: "intersection",
        components: [VertexArray, BindGroup, Buffer],
      },
      {
        type: "union",
        components: [Position, Rotation, Scale],
      },
    ],
  });

  for (const entity of renderables) {
    const vertexArray = entityManager.getComponent<VertexArray>(
      entity,
      "VertexArray"
    );
    const indexArray = entityManager.getComponent<IndexArray>(
      entity,
      "IndexArray"
    );
    const bindGroup = entityManager.getComponent<BindGroup>(
      entity,
      "BindGroup"
    );
    const modelMatrixBuffer = entityManager.getComponent<Buffer>(
      entity,
      "Buffer"
    );
    const position =
      entityManager.getComponent<Position>(entity, "Position") ?? undefined;
    const rotation =
      entityManager.getComponent<Rotation>(entity, "Rotation") ?? undefined;
    const scale =
      entityManager.getComponent<Scale>(entity, "Scale") ?? undefined;

    if (vertexArray === null) {
      console.error(`No Vertex Array found for entity ${entity}`);
      return;
    }

    if (bindGroup === null) {
      console.error(`No Bind Group found for entity ${entity}`);
      return;
    }

    if (modelMatrixBuffer === null) {
      console.error(`No Model Matrix Buffer found for entity ${entity}`);
      return;
    }

    vertexArray.initialise(device);
    bindGroup.initialise(device);
    modelMatrixBuffer.initialise(device);

    device.queue.writeBuffer(
      modelMatrixBuffer.buffer,
      0,
      calculateModelMatrix({ position, rotation, scale }).components.buffer
    );

    renderPass.setVertexBuffer(0, vertexArray.vertexBuffer);
    renderPass.setBindGroup(1, bindGroup.bindGroup);

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
