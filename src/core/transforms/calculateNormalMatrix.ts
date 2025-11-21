import { Matrix3 } from "../maths";
import {
  calculateModelMatrix,
  type Transformable,
} from "./calculateModelMatrix";

function calculateNormalMatrix(object: Transformable): Matrix3 {
  const modelMatrix = calculateModelMatrix(object);
  const inverseModelMatrix = Matrix3.fromMatrix4(modelMatrix.invert());
  const normalMatrix = inverseModelMatrix.transpose();

  return normalMatrix;
}

export { calculateNormalMatrix };
