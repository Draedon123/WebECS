import { EntityManager, type Entity } from "src/ecs";
import { Matrix4, Vector3 } from "../maths";
import type { Position, Rotation } from "../transforms";
import type { PerspectiveCamera } from "./PerspectiveCamera";

type CameraData = {
  perspectiveViewMatrix: Matrix4;
  position: Vector3;
};

function getCameraData(camera: Entity): CameraData {
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
    return { perspectiveViewMatrix: new Matrix4(), position: new Vector3() };
  }

  if (cameraPosition === null) {
    console.error("Camera does not have position component");
    return { perspectiveViewMatrix: new Matrix4(), position: new Vector3() };
  }

  if (cameraRotation === null) {
    console.error("Camera does not have rotation component");
    return { perspectiveViewMatrix: new Matrix4(), position: new Vector3() };
  }

  const perspectiveViewMatrix = cameraComponent.calculatePerspectiveViewMatrix(
    cameraPosition,
    cameraRotation
  );

  return { perspectiveViewMatrix, position: cameraPosition.position };
}

export { getCameraData };
