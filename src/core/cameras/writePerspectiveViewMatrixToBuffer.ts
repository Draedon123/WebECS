import { EntityManager, type Entity } from "src/ecs";
import type { Position, Rotation } from "../transforms";
import type { PerspectiveCamera } from "./PerspectiveCamera";

function writePerspectiveViewMatrixToBuffer(
  camera: Entity,
  buffer: GPUBuffer,
  device: GPUDevice
): void {
  const entityManager = EntityManager.getInstance();
  const cameraPosition = entityManager.getComponent<Position>(
    camera,
    "Position"
  );
  const cameraRotation = entityManager.getComponent<Rotation>(
    camera,
    "Rotation"
  );
  const cameraComponent = entityManager.getComponent<PerspectiveCamera>(
    camera,
    "PerspectiveCamera"
  );

  if (cameraComponent === null) {
    console.error("No camera found");
    return;
  }

  if (cameraPosition === null) {
    console.error("Camera does not have position component");
    return;
  }

  if (cameraRotation === null) {
    console.error("Camera does not have rotation component");
    return;
  }

  const perspectiveViewMatrix = cameraComponent.calculatePerspectiveViewMatrix(
    cameraPosition,
    cameraRotation
  );

  device.queue.writeBuffer(buffer, 0, perspectiveViewMatrix.components.buffer);
}

export { writePerspectiveViewMatrixToBuffer };
