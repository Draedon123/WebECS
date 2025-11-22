import { EntityManager } from "src/ecs";
import { Light } from "./Light";
import { Position } from "src/core/transforms";
import { PointLight } from "./PointLight";
import { BufferWriter } from "src/core/gpu";
import { writePointLightToBuffer } from "./writePointLightToBuffer";

function writeAllPointLightsToBuffer(
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const entityManager = EntityManager.getInstance();
  const pointLights = entityManager.querySingular({
    type: "intersection",
    components: [Light, PointLight, Position],
  });

  // TODO: ensure this doesn't exceed max point lights
  const bufferWriter = new BufferWriter(
    4 * 4 + pointLights.length * PointLight.byteLength
  );

  bufferWriter.writeUint32(pointLights.length);
  bufferWriter.pad(12);

  for (const light of pointLights) {
    writePointLightToBuffer(light, bufferWriter);
  }

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeAllPointLightsToBuffer };
