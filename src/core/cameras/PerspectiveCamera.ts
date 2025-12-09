import { Component } from "src/ecs";
import { Matrix4, Quaternion, toDegrees, toRadians, Vector3 } from "../maths";
import { Position, Rotation } from "../transforms";
import { calculateModelMatrix } from "../transforms/calculateModelMatrix";

type PerspectiveCameraOptions = {
  /** degrees */
  fov: number;
  near: number;
  far: number;
  aspectRatio: number;
};

class PerspectiveCamera extends Component {
  public static readonly tag: string = "PerspectiveCamera";

  private _fovDegrees: number;
  private _near: number;
  private _far: number;
  private _aspectRatio: number;

  private projectionMatrix: Matrix4;
  private viewMatrix: Matrix4;
  private viewProjectionMatrix: Matrix4;

  private dirtyProjection: boolean;
  private dirtyView: boolean;
  private dirtyViewProjection: boolean;

  private lastPosition: Vector3;
  private lastRotation: Quaternion;

  constructor(options: Partial<PerspectiveCameraOptions> = {}) {
    super(PerspectiveCamera.tag);

    this._fovDegrees = options.fov ?? 60;
    this._near = options.near ?? 1e-3;
    this._far = options.far ?? 1e3;
    this._aspectRatio = options.aspectRatio ?? 16 / 9;

    this.projectionMatrix = new Matrix4();
    this.viewMatrix = new Matrix4();
    this.viewProjectionMatrix = new Matrix4();

    this.dirtyProjection = true;
    this.dirtyView = true;
    this.dirtyViewProjection = true;

    this.lastPosition = new Vector3(NaN, NaN, NaN);
    this.lastRotation = new Quaternion(NaN, NaN, NaN, NaN);
  }

  public get fovRadians(): number {
    return toRadians(this.fovDegrees);
  }

  public set fovRadians(radians: number) {
    this.fovDegrees = toDegrees(radians);
  }

  public get fovDegrees(): number {
    return this._fovDegrees;
  }

  public set fovDegrees(degrees: number) {
    if (this._fovDegrees === degrees) {
      return;
    }

    this._fovDegrees = degrees;
    this.dirtyProjection = true;
    this.dirtyViewProjection = true;
  }

  public get near(): number {
    return this._near;
  }

  public set near(near: number) {
    if (this._near === near) {
      return;
    }

    this._near = near;
    this.dirtyProjection = true;
    this.dirtyViewProjection = true;
  }

  public get far(): number {
    return this._far;
  }

  public set far(far: number) {
    if (this._far === far) {
      return;
    }

    this._far = far;
    this.dirtyProjection = true;
    this.dirtyViewProjection = true;
  }

  public get aspectRatio(): number {
    return this._aspectRatio;
  }

  public set aspectRatio(aspectRatio: number) {
    if (this._aspectRatio === this._aspectRatio) {
      return;
    }

    this._aspectRatio = aspectRatio;
    this.dirtyProjection = true;
    this.dirtyViewProjection = true;
  }

  public getViewProjectionMatrix(
    position: Position,
    rotation: Rotation
  ): Matrix4 {
    if (this.dirtyViewProjection) {
      const projectionMatrix = this.getProjectionMatrix();
      const viewMatrix = this.getViewMatrix(position, rotation);

      Matrix4.multiplyMatrices(
        projectionMatrix,
        viewMatrix,
        this.viewProjectionMatrix
      );
    }

    return this.viewProjectionMatrix;
  }

  public getViewMatrix(position: Position, rotation: Rotation): Matrix4 {
    if (
      this.dirtyView ||
      !this.lastPosition.equals(position.position) ||
      this.lastRotation.equals(rotation.quaternion)
    ) {
      this.viewMatrix = calculateModelMatrix({ position, rotation }).invert();
      this.dirtyView = false;
    }

    this.lastPosition = position.position;
    this.lastRotation = rotation.quaternion;

    return this.viewMatrix;
  }

  private getProjectionMatrix(): Matrix4 {
    if (this.dirtyProjection) {
      this.projectionMatrix = Matrix4.perspective(
        this.fovRadians,
        this.aspectRatio,
        this.near,
        this.far
      );

      this.dirtyProjection = false;
    }

    return this.projectionMatrix;
  }
}

export { PerspectiveCamera };
