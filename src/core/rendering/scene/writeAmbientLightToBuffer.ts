import { BufferWriter } from "src/core/gpu";
import { EntityManager, type Entity } from "src/ecs";
import { Vector3 } from "src/core/maths";
import type { Light } from "./Light";
import { AmbientLight } from "./AmbientLight";

function writeAmbientLightToBuffer(
  light: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const lightComponent = EntityManager.getInstance().getComponent<Light>(
    light,
    "Light"
  );

  const colour = lightComponent?.colour ?? new Vector3(0, 0, 0);
  const intensity = lightComponent?.intensity ?? 0;

  const bufferWriter = new BufferWriter(AmbientLight.byteLength);

  bufferWriter.writeVec3f(Vector3.scale(colour, 1 / 255));
  bufferWriter.writeFloat32(intensity);

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeAmbientLightToBuffer };
