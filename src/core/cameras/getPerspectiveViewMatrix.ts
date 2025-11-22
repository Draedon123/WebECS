import { EntityManager, type Entity } from "src/ecs";
import { Matrix4 } from "../maths";
import type { Position, Rotation } from "../transforms";
import type { PerspectiveCamera } from "./PerspectiveCamera";

function getPerspectiveViewMatrixToBuffer(camera: Entity): Matrix4 {
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
    return new Matrix4();
  }

  if (cameraPosition === null) {
    console.error("Camera does not have position component");
    return new Matrix4();
  }

  if (cameraRotation === null) {
    console.error("Camera does not have rotation component");
    return new Matrix4();
  }

  const perspectiveViewMatrix = cameraComponent.calculatePerspectiveViewMatrix(
    cameraPosition,
    cameraRotation
  );

  return perspectiveViewMatrix;
}

export { getPerspectiveViewMatrixToBuffer };
