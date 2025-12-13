import { EntityManager, type Entity } from "src/ecs";
import { Vector3 } from "src/core/maths";
import type { Light } from "./Light";
import { DirectionalLight } from "./DirectionalLight";
import { BufferWriter } from "src/core/gpu/BufferWriter";

function writeDirectionalLightToBuffer(
  light: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const entityManager = EntityManager.getInstance();
  const lightComponent = entityManager.getComponent<Light>(light, "Light");

  const directionalLightComponent =
    entityManager.getComponent<DirectionalLight>(light, "DirectionalLight");

  const direction =
    directionalLightComponent?.direction ?? new Vector3(0, 1, 0);
  const colour = lightComponent?.colour ?? new Vector3(0, 0, 0);
  const intensity = lightComponent?.intensity ?? 0;

  const bufferWriter = new BufferWriter(DirectionalLight.byteLength);

  bufferWriter.writeVec3f(direction);
  bufferWriter.pad(4);
  bufferWriter.writeVec3f(Vector3.scale(colour, 1 / 255));
  bufferWriter.writeFloat32(intensity);

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeDirectionalLightToBuffer };
