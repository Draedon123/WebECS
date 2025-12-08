import { Quaternion, toRadians, Vector3 } from "../maths";
import type { EquirectangularSettings } from "./Texture";

type DataIn = {
  image: ImageData;
  settings?: Partial<EquirectangularSettings>;
};

type DataOut = {
  faces: ImageData[];
  faceDimensions: number;
};

self.onmessage = (event: MessageEvent<DataIn>) => {
  const image = event.data.image;
  const settings = event.data.settings;

  const faceDimensions = image.width / 4;
  const faces = Array.from(
    { length: 6 },
    () => new ImageData(faceDimensions, faceDimensions)
  );

  const interpolate =
    (settings?.interpolation ?? "bilinear")
      ? sampleNearest
      : bilinearInterpolate;
  const horizontalRotation =
    toRadians(settings?.horizontalRotation ?? 0) % (2 * Math.PI);
  const verticalRotation =
    toRadians(settings?.verticalRotation ?? 0) % (2 * Math.PI);
  for (let i = 0; i < 6; i++) {
    const face = faces[i];

    for (let k = 0; k < faceDimensions; k++) {
      for (let j = 0; j < faceDimensions; j++) {
        // [-1, 1)
        const u = 2 * (j / faceDimensions - 0.5);
        const v = 2 * (k / faceDimensions - 0.5);

        const point = getPointOnCube(i, u, v);

        const phi = Math.asin(point.y / Math.hypot(u, v, 1)) + verticalRotation;
        const theta = Math.atan2(point.x, point.z) + horizontalRotation;

        const x = (image.width * (0.5 + theta / (2 * Math.PI))) % image.width;
        const y = (image.height * (0.5 + phi / Math.PI)) % image.height;

        const pixel = interpolate(x, y, image);
        const offset = 4 * (j + faceDimensions * k);

        face.data[offset + 0] = pixel[0];
        face.data[offset + 1] = pixel[1];
        face.data[offset + 2] = pixel[2];
        face.data[offset + 3] = pixel[3];
      }
    }
  }

  postMessage({
    faces,
    faceDimensions,
  } satisfies DataOut);
};

function getPointOnCube(face: number, u: number, v: number): Vector3 {
  switch (face) {
    // right
    case 0:
      return new Vector3(1, v, -u);
    // left
    case 1:
      return new Vector3(-1, v, u);
    // top
    case 2:
      return new Vector3(v, 1, u);
    // bottom
    case 3:
      return new Vector3(v, -1, -u);
    // back
    case 4:
      return new Vector3(u, v, 1);
    // front
    case 5:
      return new Vector3(-u, v, -1);
    default:
      throw new Error(
        `Face must be between 0 and 5 inclusive. Received ${face}`
      );
  }
}

// https://en.wikipedia.org/wiki/Bilinear_interpolation
function bilinearInterpolate(x: number, y: number, image: ImageData): number[] {
  const x1 = Math.floor(x);
  const x2 = x1 + 1;
  const y1 = Math.floor(y);
  const y2 = y1 + 1;

  const q11Offset = 4 * (x1 + image.width * y1);
  const q12Offset = 4 * (x1 + image.width * y2);
  const q21Offset = 4 * (x2 + image.width * y1);
  const q22Offset = 4 * (x2 + image.width * y2);

  const q11 = new Quaternion(
    image.data[q11Offset + 0],
    image.data[q11Offset + 1],
    image.data[q11Offset + 2],
    image.data[q11Offset + 3]
  );

  const q12 = new Quaternion(
    image.data[q12Offset + 0],
    image.data[q12Offset + 1],
    image.data[q12Offset + 2],
    image.data[q12Offset + 3]
  );

  const q21 = new Quaternion(
    image.data[q21Offset + 0],
    image.data[q21Offset + 1],
    image.data[q21Offset + 2],
    image.data[q21Offset + 3]
  );

  const q22 = new Quaternion(
    image.data[q22Offset + 0],
    image.data[q22Offset + 1],
    image.data[q22Offset + 2],
    image.data[q22Offset + 3]
  );

  const result = q11
    .scale((x2 - x) * (y2 - y))
    .add(q12.scale((x2 - x) * (y - y1)))
    .add(q21.scale((x - x1) * (y2 - y)))
    .add(q22.scale((x - x1) * (y - y1)))
    .scale(1 / ((x2 - x1) * (y2 - y1)));

  return [result.x, result.y, result.z, result.w];
}

function sampleNearest(x: number, y: number, image: ImageData): number[] {
  const offset = 4 * (Math.round(x) + Math.round(y) * image.width);

  return [
    image.data[offset + 0],
    image.data[offset + 1],
    image.data[offset + 2],
    image.data[offset + 3],
  ];
}

export type { DataIn, DataOut };
