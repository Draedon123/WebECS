import { EntityManager, type Entity } from "src/ecs";
import { Position, Rotation, Scale } from "../transforms";
import { ResourceManager } from "../ResourceManager";
import { MeshReference } from "../meshes/MeshReference";
import { TextureReference } from "./TextureReference";
import { Parent } from "src/ecs/Parent";
import { Matrix4 } from "../maths";
import { BufferWriter } from "../gpu/BufferWriter";
import { calculateModelMatrix } from "../transforms/calculateModelMatrix";
import { calculateNormalMatrix } from "../transforms/calculateNormalMatrix";

function render(
  resourceManager: ResourceManager,
  device: GPUDevice,
  renderPass: GPURenderPassEncoder
): void {
  const entityManager = EntityManager.getInstance();
  const renderables = entityManager.querySingular({
    type: "union",
    components: [Parent, MeshReference],
  });

  for (let i = 0; i < renderables.length; i++) {
    const entity = renderables[i];

    renderObject(entity, i, resourceManager, device, renderPass);
  }
}

function renderObject(
  entity: Entity,
  objectIndex: number,
  resourceManager: ResourceManager,
  device: GPUDevice,
  renderPass: GPURenderPassEncoder
): void {
  const entityManager = EntityManager.getInstance();
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
  );

  const textureKey =
    textureReference?.textureKey ?? ResourceManager.DEFAULT_TEXTURE_KEY;
  const texture = resourceManager.getTexture(textureKey);

  if (texture === null) {
    console.error(`No texture found with key ${textureKey}`);
    return;
  }

  const parent =
    entityManager.getComponent<Parent>(entity, "Parent")?.parent ?? null;

  const position =
    entityManager.getComponent<Position>(entity, "Position") ?? undefined;
  const rotation =
    entityManager.getComponent<Rotation>(entity, "Rotation") ?? undefined;
  const scale = entityManager.getComponent<Scale>(entity, "Scale") ?? undefined;

  const bufferWriter = new BufferWriter(resourceManager.transformByteLength);
  const modelMatrix = calculateModelMatrix({ position, rotation, scale });

  if (parent !== null) {
    const position =
      entityManager.getComponent<Position>(parent, "Position") ?? undefined;
    const rotation =
      entityManager.getComponent<Rotation>(parent, "Rotation") ?? undefined;
    const scale =
      entityManager.getComponent<Scale>(parent, "Scale") ?? undefined;

    Matrix4.multiplyMatrices(
      modelMatrix,
      calculateModelMatrix({ position, rotation, scale }),
      modelMatrix
    );
  }

  const normalMatrix = calculateNormalMatrix(modelMatrix);

  bufferWriter.writeMat4x4f(modelMatrix);
  bufferWriter.writeMat3x3f(normalMatrix);

  const bufferOffset =
    objectIndex *
    (resourceManager.transformByteLength + resourceManager.transformsPadding);
  device.queue.writeBuffer(
    resourceManager.transformsBuffer,
    bufferOffset,
    bufferWriter.buffer
  );

  renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);
  renderPass.setBindGroup(1, texture.bindGroup, [
    objectIndex *
      (resourceManager.transformByteLength + resourceManager.transformsPadding),
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

export { render };
