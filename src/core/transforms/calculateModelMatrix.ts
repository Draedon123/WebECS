import { Matrix4 } from "../maths";
import type { Position } from "./Position";
import type { Rotation } from "./Rotation";
import type { Scale } from "./Scale";

type HasPosition = {
  position: Position;
};

type HasRotation = {
  rotation: Rotation;
};

type HasScale = {
  scale: Scale;
};

type Transformable = Partial<HasPosition & HasRotation & HasScale>;

function calculateModelMatrix(object: Transformable): Matrix4 {
  const modelMatrix = new Matrix4();

  if (object.position !== undefined) {
    const translation = Matrix4.fromTranslation(object.position);
    Matrix4.multiplyMatrices(modelMatrix, translation, modelMatrix);
  }

  if (object.rotation !== undefined) {
    const rotation = object.rotation.calculateRotationMatrix();
    Matrix4.multiplyMatrices(modelMatrix, rotation, modelMatrix);
  }

  if (object.scale !== undefined) {
    const scale = Matrix4.fromScale(object.scale);
    Matrix4.multiplyMatrices(modelMatrix, scale, modelMatrix);
  }

  return modelMatrix;
}

export { calculateModelMatrix };
export type { HasPosition, HasRotation, HasScale, Transformable };
