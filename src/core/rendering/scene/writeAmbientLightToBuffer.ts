import { BufferWriter } from "src/core/gpu";
import { EntityManager, type Entity } from "src/ecs";
import { Vector3 } from "src/core/maths";
import type { Light } from "./Light";

const AMBIENT_LIGHT_BYTE_LENGTH = 4 * 4;

function writeAmbientLightToBuffer(
  scene: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const lightComponent = EntityManager.getInstance().getComponent<Light>(
    scene,
    "AmbientLight"
  );

  const colour = lightComponent?.colour ?? new Vector3(0, 0, 0);
  const intensity = lightComponent?.intensity ?? 0;

  const bufferWriter = new BufferWriter(AMBIENT_LIGHT_BYTE_LENGTH);

  bufferWriter.writeVec3f(Vector3.scale(colour, 1 / 255));
  bufferWriter.writeFloat32(intensity);

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeAmbientLightToBuffer };
