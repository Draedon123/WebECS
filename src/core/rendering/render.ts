import { EntityManager } from "src/ecs";
import {
  calculateModelMatrix,
  calculateNormalMatrix,
  Position,
  Rotation,
  Scale,
} from "../transforms";
import { BufferWriter } from "../gpu";
import { ResourceManager } from "../ResourceManager";
import { MeshReference } from "../meshes/MeshReference";

function render(
  resourceManager: ResourceManager,
  device: GPUDevice,
  renderPass: GPURenderPassEncoder
): void {
  const entityManager = EntityManager.getInstance();
  const renderables = entityManager.queryMultiple({
    type: "intersection",
    queries: [
      {
        type: "intersection",
        components: [MeshReference],
      },
      {
        type: "union",
        components: [Position, Rotation, Scale],
      },
    ],
  });

  for (const entity of renderables) {
    const meshReference = entityManager.getComponent<MeshReference>(
      entity,
      "MeshReference"
    ) as MeshReference;

    const mesh = resourceManager.getMesh(meshReference.meshKey);

    if (mesh === null) {
      console.error(`No mesh found with key ${meshReference.meshKey}`);
      return;
    }

    const object = resourceManager.getObject(entity);

    const position =
      entityManager.getComponent<Position>(entity, "Position") ?? undefined;
    const rotation =
      entityManager.getComponent<Rotation>(entity, "Rotation") ?? undefined;
    const scale =
      entityManager.getComponent<Scale>(entity, "Scale") ?? undefined;

    if (object === null) {
      console.error(`Object ${entity} not registered`);
      return;
    }

    const bufferWriter = new BufferWriter((16 + 12) * 4);
    const modelMatrix = calculateModelMatrix({ position, rotation, scale });
    const normalMatrix = calculateNormalMatrix({ position, rotation, scale });

    bufferWriter.writeMat4x4f(modelMatrix);
    bufferWriter.writeMat3x3f(normalMatrix);

    device.queue.writeBuffer(object.transformBuffer, 0, bufferWriter.buffer);

    renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);
    renderPass.setBindGroup(1, object.bindGroup);

    if (mesh.indices !== undefined) {
      if (!mesh.indices.initialised) {
        mesh.indices.initialise(device);
      }

      renderPass.setIndexBuffer(
        mesh.indices.indexBuffer,
        mesh.indices.indexFormat
      );
      renderPass.drawIndexed(mesh.indices.indexCount, 1);
    } else {
      renderPass.draw(mesh.vertices.vertexCount, 1);
    }
  }
}

export { render };
