import { Vector2, Vector3 } from "src/core/maths";
import { VertexArray, type Vertex } from "../VertexArray";
import { IndexArray } from "../IndexArray";
import type { MeshEntry } from "src/core/ResourceManager";
import { Texture } from "src/core/rendering";

type Material = {
  name: string;
  texture: Texture;
};

async function loadObj(
  filePath: string
): Promise<{ mesh: MeshEntry; materials: Record<string, Material> }> {
  const fileContents = await (await fetch(filePath)).text();
  const lines = fileContents.split(/[\r\n]+/);

  const vertices: Vertex[] = [];
  const indices: number[] = [];

  const vertexPositions: Vector3[] = [];
  const textureCoordinates: Vector2[] = [];
  const vertexNormals: Vector3[] = [];
  const materials: Record<string, Material> = {};

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
          filePath.split("/").slice(0, -1).join("/") + "/" + parts[1];
        const loadedMaterials = await loadMtl(mtlPath);

        for (const material of loadedMaterials) {
          materials[material.name] = material;
        }

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

        // triangulation algorithm assuming faces are wound anticlockwise
        const vertexCount = parts.length - 1;
        for (let i = 1; i < vertexCount - 1; i++) {
          const firstVertex = vertices.length - vertexCount;

          indices.push(firstVertex, firstVertex + i, firstVertex + i + 1);
        }

        break;
      }
    }
  }

  return {
    mesh: {
      vertices: new VertexArray(vertices),
      indices: new IndexArray(indices),
    },
    materials,
  };
}

async function loadMtl(filePath: string): Promise<Material[]> {
  const fileContents = await (await fetch(filePath)).text();
  const rawMaterialsData = fileContents.split(/(newmtl)/);
  const materials: Material[] = [];

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

          material.texture = Texture.colour(r, g, b);
          break;
        }

        case "map_Kd": {
          // assume texture is in same directory as mtl file
          const url = parts[1];
          const texture = await Texture.fetch(url);

          material.texture = texture;
          break;
        }
      }
    }

    materials.push(material);
  }

  return materials;
}

export { loadObj };
