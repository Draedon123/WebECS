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
import { TextureReference } from "./TextureReference";

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
        components: [MeshReference, TextureReference],
      },
      {
        type: "union",
        components: [Position, Rotation, Scale],
      },
    ],
  });

  for (let i = 0; i < renderables.length; i++) {
    const entity = renderables[i];

    const meshReference = entityManager.getComponent<MeshReference>(
      entity,
      "MeshReference"
    ) as MeshReference;

    const mesh = resourceManager.getMesh(meshReference.meshKey);

    if (mesh === null) {
      console.error(`No mesh found with key ${meshReference.meshKey}`);
      return;
    }

    const textureReference = entityManager.getComponent<TextureReference>(
      entity,
      "TextureReference"
    ) as TextureReference;

    const texture = resourceManager.getTexture(textureReference.textureKey);

    if (texture === null) {
      console.error(`No texture found with key ${textureReference.textureKey}`);
      return;
    }

    const position =
      entityManager.getComponent<Position>(entity, "Position") ?? undefined;
    const rotation =
      entityManager.getComponent<Rotation>(entity, "Rotation") ?? undefined;
    const scale =
      entityManager.getComponent<Scale>(entity, "Scale") ?? undefined;

    const bufferWriter = new BufferWriter(
      resourceManager.transformByteLength,
      undefined,
      0
    );
    const modelMatrix = calculateModelMatrix({ position, rotation, scale });
    const normalMatrix = calculateNormalMatrix({ position, rotation, scale });

    bufferWriter.writeMat4x4f(modelMatrix);
    bufferWriter.writeMat3x3f(normalMatrix);

    const bufferOffset =
      i *
      (resourceManager.transformByteLength + resourceManager.transformsPadding);
    device.queue.writeBuffer(
      resourceManager.transformsBuffer,
      bufferOffset,
      bufferWriter.buffer
    );

    renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);
    renderPass.setBindGroup(1, texture.bindGroup, [
      i *
        (resourceManager.transformByteLength +
          resourceManager.transformsPadding),
    ]);

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
