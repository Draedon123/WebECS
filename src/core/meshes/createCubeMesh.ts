import { Vector2, Vector3 } from "../maths";
import type { Vertex } from "./VertexArray";

function createCubeMesh(sideLength: number = 1): Vertex[] {
  const x = sideLength / 2;

  const POSITIONS = {
    PPP: new Vector3(x, x, x),
    PPN: new Vector3(x, x, -x),
    PNP: new Vector3(x, -x, x),
    PNN: new Vector3(x, -x, -x),
    NPP: new Vector3(-x, x, x),
    NPN: new Vector3(-x, x, -x),
    NNP: new Vector3(-x, -x, x),
    NNN: new Vector3(-x, -x, -x),
  };

  const UVS = {
    UL: new Vector2(0, 0),
    UR: new Vector2(1, 0),
    BL: new Vector2(0, 1),
    BR: new Vector2(1, 1),
  };

  const NORMALS = {
    FRONT: new Vector3(0, 0, 1),
    BACK: new Vector3(0, 0, -1),
    LEFT: new Vector3(-1, 0, 0),
    RIGHT: new Vector3(1, 0, 0),
    TOP: new Vector3(0, 1, 0),
    BOTTOM: new Vector3(0, -1, 0),
  };

  const vertices: Vertex[] = [
    //#region Front
    {
      position: POSITIONS.NPP,
      uv: UVS.UL,
      normal: NORMALS.FRONT,
    },
    {
      position: POSITIONS.NNP,
      uv: UVS.BL,
      normal: NORMALS.FRONT,
    },
    {
      position: POSITIONS.PPP,
      uv: UVS.UR,
      normal: NORMALS.FRONT,
    },
    {
      position: POSITIONS.PPP,
      uv: UVS.UR,
      normal: NORMALS.FRONT,
    },
    {
      position: POSITIONS.NNP,
      uv: UVS.BL,
      normal: NORMALS.FRONT,
    },
    {
      position: POSITIONS.PNP,
      uv: UVS.BR,
      normal: NORMALS.FRONT,
    },
    //#endregion
    //#region Back
    {
      position: POSITIONS.PPN,
      uv: UVS.UL,
      normal: NORMALS.BACK,
    },
    {
      position: POSITIONS.PNN,
      uv: UVS.BL,
      normal: NORMALS.BACK,
    },
    {
      position: POSITIONS.NPN,
      uv: UVS.UR,
      normal: NORMALS.BACK,
    },
    {
      position: POSITIONS.NPN,
      uv: UVS.UR,
      normal: NORMALS.BACK,
    },
    {
      position: POSITIONS.PNN,
      uv: UVS.BL,
      normal: NORMALS.BACK,
    },
    {
      position: POSITIONS.NNN,
      uv: UVS.BR,
      normal: NORMALS.BACK,
    },
    //#endregion
    //#region Left
    {
      position: POSITIONS.NPN,
      uv: UVS.UL,
      normal: NORMALS.LEFT,
    },
    {
      position: POSITIONS.NNN,
      uv: UVS.BL,
      normal: NORMALS.LEFT,
    },
    {
      position: POSITIONS.NPP,
      uv: UVS.UR,
      normal: NORMALS.LEFT,
    },
    {
      position: POSITIONS.NPP,
      uv: UVS.UR,
      normal: NORMALS.LEFT,
    },
    {
      position: POSITIONS.NNN,
      uv: UVS.BL,
      normal: NORMALS.LEFT,
    },
    {
      position: POSITIONS.NNP,
      uv: UVS.BR,
      normal: NORMALS.LEFT,
    },
    //#endregion
    //#region Right
    {
      position: POSITIONS.PPP,
      uv: UVS.UL,
      normal: NORMALS.RIGHT,
    },
    {
      position: POSITIONS.PNP,
      uv: UVS.BL,
      normal: NORMALS.RIGHT,
    },
    {
      position: POSITIONS.PPN,
      uv: UVS.UR,
      normal: NORMALS.RIGHT,
    },
    {
      position: POSITIONS.PPN,
      uv: UVS.UR,
      normal: NORMALS.RIGHT,
    },
    {
      position: POSITIONS.PNP,
      uv: UVS.BL,
      normal: NORMALS.RIGHT,
    },
    {
      position: POSITIONS.PNN,
      uv: UVS.BR,
      normal: NORMALS.RIGHT,
    },
    //#endregion
    //#region Top
    {
      position: POSITIONS.NPN,
      uv: UVS.UL,
      normal: NORMALS.TOP,
    },
    {
      position: POSITIONS.NPP,
      uv: UVS.BL,
      normal: NORMALS.TOP,
    },
    {
      position: POSITIONS.PPN,
      uv: UVS.UR,
      normal: NORMALS.TOP,
    },
    {
      position: POSITIONS.PPN,
      uv: UVS.UR,
      normal: NORMALS.TOP,
    },
    {
      position: POSITIONS.NPP,
      uv: UVS.BL,
      normal: NORMALS.TOP,
    },
    {
      position: POSITIONS.PPP,
      uv: UVS.BR,
      normal: NORMALS.TOP,
    },
    //#endregion
    //#region Bottom
    {
      position: POSITIONS.NNP,
      uv: UVS.UL,
      normal: NORMALS.BOTTOM,
    },
    {
      position: POSITIONS.NNN,
      uv: UVS.BL,
      normal: NORMALS.BOTTOM,
    },
    {
      position: POSITIONS.PNP,
      uv: UVS.UR,
      normal: NORMALS.BOTTOM,
    },
    {
      position: POSITIONS.PNP,
      uv: UVS.UR,
      normal: NORMALS.BOTTOM,
    },
    {
      position: POSITIONS.NNN,
      uv: UVS.BL,
      normal: NORMALS.BOTTOM,
    },
    {
      position: POSITIONS.PNN,
      uv: UVS.BR,
      normal: NORMALS.BOTTOM,
    },
    //#endregion
  ];

  return vertices;
}

export { createCubeMesh };
