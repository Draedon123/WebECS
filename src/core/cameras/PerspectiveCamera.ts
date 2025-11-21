import { Component } from "src/ecs";
import { Matrix4, toDegrees, toRadians } from "../maths";
import { calculateModelMatrix, Position, Rotation } from "../transforms";

type PerspectiveCameraOptions = {
  /** degrees */
  fov: number;
  near: number;
  far: number;
  aspectRatio: number;

  position: Position;
  rotation: Rotation;
};

class PerspectiveCamera extends Component {
  public static readonly tag: string = "PerspectiveCamera";

  public fovDegrees: number;
  public near: number;
  public far: number;
  public aspectRatio: number;

  public position: Position;
  public rotation: Rotation;

  constructor(options: Partial<PerspectiveCameraOptions>) {
    super(PerspectiveCamera.tag);

    this.fovDegrees = options.fov ?? 60;
    this.near = options.near ?? 1e-3;
    this.far = options.far ?? 1e3;
    this.aspectRatio = options.aspectRatio ?? 16 / 9;

    this.position = options.position ?? new Position();
    this.rotation = options.rotation ?? new Rotation();
  }

  public get fovRadians(): number {
    return toRadians(this.fovDegrees);
  }

  public set fovRadians(radians: number) {
    this.fovDegrees = toDegrees(radians);
  }

  public calculateViewMatrix(): Matrix4 {
    const modelMatrix = calculateModelMatrix(this);
    const perspectiveMatrix = this.calculatePerspectiveMatrix();
    const viewMatrix = modelMatrix.invert();

    Matrix4.multiplyMatrices(viewMatrix, perspectiveMatrix, viewMatrix);

    return viewMatrix;
  }

  private calculatePerspectiveMatrix(): Matrix4 {
    return Matrix4.perspective(
      this.fovRadians,
      this.aspectRatio,
      this.near,
      this.far
    );
  }
}

export { PerspectiveCamera };
