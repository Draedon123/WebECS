import { type Entity } from "src/ecs";
import { getPerspectiveViewMatrixToBuffer } from "./getPerspectiveViewMatrix";

function writePerspectiveViewMatrixToBuffer(
  camera: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  device.queue.writeBuffer(
    buffer,
    0,
    getPerspectiveViewMatrixToBuffer(camera).components.buffer
  );
}

export { writePerspectiveViewMatrixToBuffer };
