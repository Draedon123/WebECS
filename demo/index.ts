import { Texture } from "src/core/rendering/Texture";
import {
  BindGroup,
  Buffer,
  createCubeMesh,
  EntityManager,
  PerspectiveCamera,
  Position,
  Renderer,
  Rotation,
  Scale,
  VertexArray,
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const camera = entityManager.createEntity();
  const cameraComponent = new PerspectiveCamera({});
  entityManager.addComponent(camera, cameraComponent);
  entityManager.addComponent(camera, new Position(0, 2, 10));
  entityManager.addComponent(camera, new Rotation(0, 0, 0));

  const cubeMesh = createCubeMesh();
  const cube = entityManager.createEntity();
  const transformsBuffer = new Buffer({
    label: "Cube Transforms",
    size: (16 + 12) * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cubeRotation = new Rotation();
  const cubeTexture = Texture.colour(255, 0, 0);
  // @ts-expect-error will fix later
  transformsBuffer.initialise(renderer.device);
  // @ts-expect-error will fix later
  cubeTexture.initialise(renderer.device);
  entityManager.addComponent(cube, new VertexArray(cubeMesh, "Cube"));
  entityManager.addComponent(cube, transformsBuffer);
  entityManager.addComponent(
    cube,
    new BindGroup({
      layout: renderer.perObjectBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: transformsBuffer.buffer,
        },
        {
          binding: 1,
          resource: cubeTexture.texture.createView(),
        },
      ],
    })
  );
  entityManager.addComponent(cube, new Position(0, 0, 0));
  entityManager.addComponent(cube, cubeRotation);
  entityManager.addComponent(cube, new Scale(2));

  function render() {
    cameraComponent.aspectRatio = canvas.width / canvas.height;

    cubeRotation.rotateX(0.3);
    cubeRotation.rotateY(0.2);
    cubeRotation.rotateZ(0.4);

    renderer.render(camera);
    requestAnimationFrame(render);
  }

  render();
}

main();
