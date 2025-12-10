import { Vector3 } from "src/core/maths";
import { Component } from "src/ecs";
import { Texture } from "./Texture";
import type { BufferWriter } from "src/core/gpu/BufferWriter";

type PhongMaterialOptions = {
  ambient: Vector3;
  diffuse: Vector3;
  specular: Vector3;
  ambientMap: Texture;
  diffuseMap: Texture;
  specularMap: Texture;
  normalMap: Texture;
  shininess: number;
};

class PhongMaterial extends Component {
  public static readonly tag: string = "PhongMaterial";
  public static readonly BYTE_LENGTH: number = 12 * 4;
  public static readonly DEFAULT: PhongMaterial = new PhongMaterial();

  public readonly byteLength: number;
  public ambient: Vector3;
  public diffuse: Vector3;
  public specular: Vector3;
  public ambientMap: Texture;
  public diffuseMap: Texture;
  public specularMap: Texture;
  public normalMap: Texture;
  public shininess: number;

  constructor(options: Partial<PhongMaterialOptions> = {}) {
    super(PhongMaterial.tag);

    this.byteLength = PhongMaterial.BYTE_LENGTH;

    this.ambient = options.ambient ?? new Vector3(255, 255, 255);
    this.diffuse = options.diffuse ?? new Vector3(255, 255, 255);
    this.specular = options.specular ?? new Vector3(255, 255, 255);

    this.ambientMap = options.ambientMap ?? Texture.colour(255, 255, 255);
    this.diffuseMap = options.diffuseMap ?? Texture.colour(255, 255, 255);
    this.specularMap = options.specularMap ?? Texture.colour(255, 255, 255);
    this.normalMap = options.normalMap ?? Texture.colour(255, 255, 255);

    this.shininess = options.shininess ?? 32;
  }

  public writeToBuffer(bufferWriter: BufferWriter): void {
    bufferWriter.writeVec3f(this.ambient);
    bufferWriter.pad(4);
    bufferWriter.writeVec3f(this.diffuse);
    bufferWriter.pad(4);
    bufferWriter.writeVec3f(this.specular);
    bufferWriter.writeFloat32(this.shininess);
  }
}

export { PhongMaterial };
export type { PhongMaterialOptions };
