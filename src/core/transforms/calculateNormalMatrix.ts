import { Matrix3, Matrix4 } from "../maths";
import {
  calculateModelMatrix,
  type Transformable,
} from "./calculateModelMatrix";

function calculateNormalMatrix(
  objectOrModelMatrix: Transformable | Matrix4
): Matrix3 {
  const modelMatrix =
    objectOrModelMatrix instanceof Matrix4
      ? objectOrModelMatrix
      : calculateModelMatrix(objectOrModelMatrix);
  const inverseModelMatrix = Matrix3.fromMatrix4(modelMatrix.invert());
  const normalMatrix = inverseModelMatrix.transpose();

  return normalMatrix;
}

export { calculateNormalMatrix };
