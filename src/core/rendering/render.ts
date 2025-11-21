import { EntityManager } from "src/ecs";
import { IndexArray } from "../meshes";
import { VertexArray } from "../meshes";
import {
  calculateModelMatrix,
  calculateNormalMatrix,
  Position,
  Rotation,
  Scale,
} from "../transforms";
import { BindGroup, Buffer, BufferWriter } from "../gpu";

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
    const transformsBuffer = entityManager.getComponent<Buffer>(
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

    if (transformsBuffer === null) {
      console.error(`No Transforms Buffer found for entity ${entity}`);
      return;
    }

    vertexArray.initialise(device);
    bindGroup.initialise(device);
    transformsBuffer.initialise(device);

    const bufferWriter = new BufferWriter((16 + 12) * 4);
    const modelMatrix = calculateModelMatrix({ position, rotation, scale });
    const normalMatrix = calculateNormalMatrix({ position, rotation, scale });

    bufferWriter.writeMat4x4f(modelMatrix);
    bufferWriter.writeMat3x3f(normalMatrix);

    device.queue.writeBuffer(transformsBuffer.buffer, 0, bufferWriter.buffer);

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
