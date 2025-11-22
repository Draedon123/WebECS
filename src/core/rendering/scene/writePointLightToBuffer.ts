import { BufferWriter } from "src/core/gpu";
import { EntityManager, type Entity } from "src/ecs";
import type { Light } from "./Light";
import { Position } from "src/core/transforms";
import { Vector3 } from "src/core/maths";
import { PointLight } from "./PointLight";

function writePointLightToBuffer(light: Entity, buffer: BufferWriter): void {
  const entityManger = EntityManager.getInstance();
  const lightComponent = entityManger.getComponent<Light>(
    light,
    "Light"
  ) as Light;

  const pointLightComponent = entityManger.getComponent<PointLight>(
    light,
    "PointLight"
  ) as PointLight;

  const position = entityManger.getComponent<Position>(
    light,
    "Position"
  ) as Position;

  buffer.writeVec3f(position.position);
  buffer.pad(4);
  buffer.writeVec3f(Vector3.scale(lightComponent.colour, 1 / 255));
  buffer.writeFloat32(lightComponent.intensity);
  buffer.writeFloat32(pointLightComponent.maxDistance);
  buffer.writeFloat32(pointLightComponent.decayRate);
  buffer.pad(2 * 4);
}

export { writePointLightToBuffer };
