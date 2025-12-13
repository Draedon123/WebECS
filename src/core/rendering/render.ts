import { EntityManager, type Entity } from "src/ecs";
import { Position, Rotation, Scale } from "../transforms";
import { ResourceManager } from "../managers/ResourceManager";
import { MeshReference } from "../meshes/MeshReference";
import { Parent } from "src/ecs/Parent";
import { Matrix4 } from "../maths";
import { BufferWriter } from "../gpu/BufferWriter";
import { calculateModelMatrix } from "../transforms/calculateModelMatrix";
import { calculateNormalMatrix } from "../transforms/calculateNormalMatrix";
import type { MaterialReference } from "./materials/MaterialReference";
import { PhongMaterial } from "./materials";
import type { Renderer } from "./Renderer";

function render(
  renderer: Renderer,
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

    renderObject(entity, i, renderer, resourceManager, device, renderPass);
  }
}

function renderObject(
  entity: Entity,
  objectIndex: number,
  renderer: Renderer,
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

  const materialReference = entityManager.getComponent<MaterialReference>(
    entity,
    "MaterialReference"
  );

  const material = materialReference?.activeMaterial ?? PhongMaterial.DEFAULT;

  const parent =
    entityManager.getComponent<Parent>(entity, "Parent")?.parent ?? null;

  const position =
    entityManager.getComponent<Position>(entity, "Position") ?? undefined;
  const rotation =
    entityManager.getComponent<Rotation>(entity, "Rotation") ?? undefined;
  const scale = entityManager.getComponent<Scale>(entity, "Scale") ?? undefined;

  const bufferWriter = new BufferWriter(
    resourceManager.transformBindings.transformByteLength
  );
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
  bufferWriter.writeUint32(
    resourceManager.materials.getMaterialIndex(material)
  );

  const bufferOffset =
    objectIndex *
    (resourceManager.transformBindings.transformByteLength +
      resourceManager.transformBindings.transformsPadding);
  device.queue.writeBuffer(
    resourceManager.transformBindings.transformsBuffer,
    bufferOffset,
    bufferWriter.buffer
  );

  renderPass.setVertexBuffer(0, mesh.vertices.vertexBuffer);
  renderPass.setPipeline(resourceManager.materials.getRenderPipeline(material));
  renderPass.setBindGroup(0, renderer.bindGroup0);
  renderPass.setBindGroup(
    1,
    resourceManager.transformBindings.transformsBindGroup,
    [
      objectIndex *
        (resourceManager.transformBindings.transformByteLength +
          resourceManager.transformBindings.transformsPadding),
    ]
  );
  renderPass.setBindGroup(2, resourceManager.materials.getBindGroup(material));

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
