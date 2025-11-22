import { BufferWriter } from "src/core/gpu";
import { EntityManager, type Entity } from "src/ecs";
import { AmbientLight } from "./AmbientLight";
import { Vector3 } from "src/core/maths";

function writeAmbientLightToBuffer(
  scene: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const lightComponent = EntityManager.getInstance().getComponent<AmbientLight>(
    scene,
    "AmbientLight"
  );

  const colour = lightComponent?.colour ?? new Vector3(0, 0, 0);
  const ambientStrength = lightComponent?.ambientStrength ?? 0;

  const bufferWriter = new BufferWriter(AmbientLight.byteLength);

  bufferWriter.writeVec3f(Vector3.scale(colour, 1 / 255));
  bufferWriter.writeFloat32(ambientStrength);

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeAmbientLightToBuffer };
