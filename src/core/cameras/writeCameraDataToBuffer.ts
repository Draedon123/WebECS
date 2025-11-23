import { type Entity } from "src/ecs";
import { getCameraData } from "./getCameraData";
import { BufferWriter } from "../gpu/BufferWriter";

function writeCameraDataToBuffer(
  camera: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const data = getCameraData(camera);
  const bufferWriter = new BufferWriter(19 * 4);

  bufferWriter.writeMat4x4f(data.perspectiveViewMatrix);
  bufferWriter.writeVec3f(data.position);

  device.queue.writeBuffer(buffer, 0, bufferWriter.buffer);
}

export { writeCameraDataToBuffer };
