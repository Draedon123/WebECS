import { Vector2, Vector3 } from "src/core/maths";
import { VertexArray, type Vertex } from "../VertexArray";
import { IndexArray } from "../IndexArray";
import type { MeshEntry } from "src/core/ResourceManager";
import { Texture } from "src/core/rendering";
import { gunzipSync, strFromU8 } from "fflate";

type Material = {
  name: string;
  texture?: number;
  normalMap?: number;
};

type Mesh = MeshEntry & {
  name: string;
  materialName: string;
};

type NamedTexture = {
  texture: Texture;
  name: string;
};

async function loadObj(filePath: string): Promise<{
  meshes: Mesh[];
  materials: Record<string, Material>;
  textures: Record<number, NamedTexture>;
}> {
  let fileContents: string;
  if (filePath.endsWith(".gz")) {
    const data = await (await fetch(filePath)).arrayBuffer();
    // my dev server automatically ungzips the file...
    const decompressed = import.meta.env.DEV
      ? new Uint8Array(data)
      : gunzipSync(new Uint8Array(data));
    fileContents = strFromU8(decompressed);
  } else {
    fileContents = await (await fetch(filePath)).text();
  }

  const lines = fileContents.split(/[\r\n]+/);

  let vertices: Vertex[] = [];
  let indices: number[] = [];

  const vertexPositions: Vector3[] = [];
  const textureCoordinates: Vector2[] = [];
  const vertexNormals: Vector3[] = [];
  const materials: Record<string, Material> = {};
  let textures: Record<number, NamedTexture> = {};

  const meshes: Mesh[] = [];

  for (const line of lines) {
    if (line[0] === "#") {
      continue;
    }

    const parts = line.split(" ");
    switch (parts[0]) {
      case "mtllib": {
        // debugger;
        // assume mtl file is in the same folder as obj
        const mtlPath =
          filePath.split("/").slice(0, -1).join("/") +
          "/" +
          parts.slice(1).join(" ");
        const loadedMaterials = await loadMtl(mtlPath);

        textures = loadedMaterials.textures;
        for (const material of loadedMaterials.materials) {
          materials[material.name] = material;
        }

        break;
      }

      case "usemtl": {
        if (meshes[meshes.length - 1].materialName === "") {
          meshes[meshes.length - 1].materialName = parts[1];
        } else {
          const mesh = meshes[meshes.length - 1];
          const meshName = "_" + mesh.name;

          mesh.indices = new IndexArray(indices, meshName + " Index Array");

          vertices = [];
          indices = [];

          meshes.push({
            name: meshName,
            materialName: parts[1],
            vertices: new VertexArray(vertices, meshName + " Vertex Array"),
          });
        }

        break;
      }

      case "o": {
        const meshName = parts[1];

        if (meshes.length > 0) {
          meshes[meshes.length - 1].indices = new IndexArray(
            indices,
            meshName + " Index Array"
          );
        }

        indices = [];
        vertices = [];

        meshes.push({
          name: meshName,
          materialName: "",
          vertices: new VertexArray(vertices, meshName + " Vertex Array"),
        });
        break;
      }

      case "v": {
        const w = parts[4] ? parseFloat(parts[4]) : 1;
        const x = parseFloat(parts[1]) / w;
        const y = parseFloat(parts[2]) / w;
        const z = parseFloat(parts[3]) / w;

        vertexPositions.push(new Vector3(x, y, z));
        break;
      }

      case "vt": {
        const u = parseFloat(parts[1]);
        const v = parts[2] ? parseFloat(parts[2]) : 0;
        // const w = parts[3] ? parseFloat(parts[3]) : 0;

        textureCoordinates.push(new Vector2(u, v));
        break;
      }

      case "vn": {
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);

        vertexNormals.push(new Vector3(x, y, z).normalise());
        break;
      }

      case "f": {
        for (let i = 1; i < parts.length; i++) {
          const vertex = parts[i];
          const vertexParts = vertex.split("/");

          const positionIndex = parseInt(vertexParts[0]) - 1;
          // will be NaN if nonexistent
          const textureCoordinateIndex = parseInt(vertexParts[1]) - 1;
          const normalsIndex = parseInt(vertexParts[2]) - 1;

          const position = vertexPositions.at(positionIndex) as Vector3;
          const uv =
            textureCoordinates.at(textureCoordinateIndex) ?? new Vector2(0, 0);
          const normal = vertexNormals.at(normalsIndex) ?? new Vector3(0, 0, 1);

          vertices.push({
            position,
            uv,
            normal,
          });
        }

        // triangulation algorithm assumes faces are wound anticlockwise
        const vertexCount = parts.length - 1;
        const firstVertex = vertices.length - vertexCount;
        for (let i = 1; i < vertexCount - 1; i++) {
          indices.push(firstVertex, firstVertex + i, firstVertex + i + 1);
        }

        break;
      }
    }
  }

  meshes[meshes.length - 1].indices = new IndexArray(
    indices,
    meshes[meshes.length - 1].name + " Index Array"
  );

  return {
    meshes,
    materials,
    textures,
  };
}

async function loadMtl(
  filePath: string
): Promise<{ materials: Material[]; textures: Record<number, NamedTexture> }> {
  const fileContents = await (await fetch(filePath)).text();
  const rawMaterialsData = fileContents.split(/(newmtl)/);
  const materials: Material[] = [];
  const textures: Record<number, NamedTexture> = [];
  const texturePromises: Promise<void>[] = [];

  for (let i = 0; i < rawMaterialsData.length; i++) {
    if (!rawMaterialsData[i - 1]?.startsWith("newmtl")) {
      continue;
    }

    const contents = "newmtl" + rawMaterialsData[i];
    const lines = contents.split(/[\r\n]+/);
    // @ts-expect-error will be populated
    const material: Material = {};

    for (const line of lines) {
      const parts = line.split(" ");

      switch (parts[0]) {
        case "newmtl": {
          material.name = parts[1];
          break;
        }

        case "Kd": {
          const r = parseFloat(parts[1]) * 255;
          const g = parseFloat(parts[2]) * 255;
          const b = parseFloat(parts[3]) * 255;

          const textureName = material.name + "_Kd";
          const texture = Texture.colour(r, g, b, 255, textureName);

          material.texture = texture.id;
          textures[texture.id] = {
            texture,
            name: textureName,
          };

          break;
        }

        case "map_Kd": {
          // assume texture is in same directory as mtl file
          const url =
            filePath.split("/").slice(0, -1).join("/") +
            "/" +
            parts.slice(1).join(" ");

          const textureName = material.name + "_map_Kd";

          texturePromises.push(
            Texture.fetch([url], textureName).then((texture) => {
              material.texture = texture.id;
              textures[texture.id] = {
                texture,
                name: textureName,
              };
            })
          );

          break;
        }

        case "norm": {
          // assume texture is in same directory as mtl file
          const url =
            filePath.split("/").slice(0, -1).join("/") +
            "/" +
            parts.slice(1).join(" ");

          const textureName = material.name + "_norm";

          texturePromises.push(
            Texture.fetch([url], textureName).then((normalMap) => {
              material.normalMap = normalMap.id;
              textures[normalMap.id] = {
                texture: normalMap,
                name: textureName,
              };
            })
          );
        }
      }
    }

    await Promise.all(texturePromises);

    materials.push(material);
  }

  return { materials, textures };
}

export { loadObj };
