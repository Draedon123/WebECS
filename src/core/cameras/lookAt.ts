import { EntityManager, type Entity } from "src/ecs";
import { toDegrees, Vector3 } from "../maths";
import { Position, Rotation } from "../transforms";

function lookAt(fromEntity: Entity, to: Vector3): void {
  const entityManager = EntityManager.getInstance();

  const position = entityManager.getComponent<Position>(fromEntity, "Position");
  const rotation = entityManager.getComponent<Rotation>(fromEntity, "Rotation");

  if (position === null) {
    console.error("Entity does not have position component");
    return;
  }

  if (rotation === null) {
    console.error("Entity does not have rotation component");
    return;
  }

  const toPoint = Vector3.subtract(to, position.position);

  if (toPoint.magnitude < 1e-6) {
    console.error("Look at point too close to entity position");
    return;
  }

  toPoint.normalise();

  rotation.setEulerAngles(
    toDegrees(Math.asin(toPoint.y)),
    // i couldn't tell you why there's a +180 here; trial and error led me here
    180 + toDegrees(Math.atan2(toPoint.x, toPoint.z)),
    0
  );
}

export { lookAt };
