import { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";
import { Texture } from "../texture/Texture";
import type { BufferWriter } from "src/core/gpu/BufferWriter";

type PhongMaterialOptions = {
  /** 0-255 */
  ambient: Vector3;
  /** 0-255 */
  diffuse: Vector3;
  /** 0-255 */
  specular: Vector3;
  ambientMap: Texture;
  diffuseMap: Texture;
  specularMap: Texture;
  normalMap: Texture;
  shininess: number;
};

class PhongMaterial extends Component {
  public static readonly tag: string = "PhongMaterial";
  public static readonly BYTE_LENGTH: number = 16 * 4;
  public static readonly DEFAULT: PhongMaterial = new PhongMaterial();

  public readonly byteLength: number;
  public ambient: Vector3;
  public diffuse: Vector3;
  public specular: Vector3;
  private _ambientMap?: Texture;
  private _diffuseMap?: Texture;
  private _specularMap?: Texture;
  private _normalMap?: Texture;
  public shininess: number;

  constructor(options: Partial<PhongMaterialOptions> = {}) {
    super(PhongMaterial.tag);

    this.byteLength = PhongMaterial.BYTE_LENGTH;

    this.ambient = options.ambient ?? new Vector3(255, 255, 255);
    this.diffuse = options.diffuse ?? new Vector3(255, 255, 255);
    this.specular = options.specular ?? new Vector3(255, 255, 255);

    this._ambientMap = options.ambientMap;
    this._diffuseMap = options.diffuseMap;
    this._specularMap = options.specularMap;
    this._normalMap = options.normalMap;

    this.shininess = options.shininess ?? 32;
  }

  public writeToBuffer(bufferWriter: BufferWriter): void {
    bufferWriter.writeVec3f(Vector3.scale(this.ambient, 1 / 255));
    bufferWriter.pad(4);
    bufferWriter.writeVec3f(Vector3.scale(this.diffuse, 1 / 255));
    bufferWriter.pad(4);
    bufferWriter.writeVec3f(Vector3.scale(this.specular, 1 / 255));
    bufferWriter.writeFloat32(this.shininess);
    bufferWriter.writeBool(this.hasNormalMap);
    bufferWriter.writeBool(this.hasAmbientMap);
    bufferWriter.writeBool(this.hasDiffuseMap);
    bufferWriter.writeBool(this.hasSpecularMap);
  }

  public get ambientMap(): Texture {
    return this._ambientMap ?? Texture.WHITE;
  }

  public set ambientMap(texture: Texture | null) {
    this._ambientMap = texture ?? undefined;
  }

  public get diffuseMap(): Texture {
    return this._diffuseMap ?? Texture.WHITE;
  }

  public set diffuseMap(texture: Texture | null) {
    this._diffuseMap = texture ?? undefined;
  }

  public get specularMap(): Texture {
    return this._specularMap ?? Texture.WHITE;
  }

  public set specularMap(texture: Texture | null) {
    this._specularMap = texture ?? undefined;
  }

  public get normalMap(): Texture {
    return this._normalMap ?? Texture.WHITE;
  }

  public set normalMap(texture: Texture | null) {
    this._normalMap = texture ?? undefined;
  }

  public get hasAmbientMap(): boolean {
    return this._ambientMap !== undefined;
  }

  public get hasDiffuseMap(): boolean {
    return this._diffuseMap !== undefined;
  }

  public get hasSpecularMap(): boolean {
    return this._specularMap !== undefined;
  }

  public get hasNormalMap(): boolean {
    return this._normalMap !== undefined;
  }
}

export { PhongMaterial };
export type { PhongMaterialOptions };
