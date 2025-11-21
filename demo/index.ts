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
  entityManager.addComponent(camera, new Position());
  entityManager.addComponent(camera, new Rotation(0, 0, 0));

  const cubeMesh = createCubeMesh();
  const cube = entityManager.createEntity();
  const modelMatrixBuffer = new Buffer({
    label: "Cube Model Matrix",
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const cubeRotation = new Rotation();
  // @ts-expect-error will fix later
  modelMatrixBuffer.initialise(renderer.device);
  entityManager.addComponent(cube, new VertexArray(cubeMesh, "Cube"));
  entityManager.addComponent(cube, modelMatrixBuffer);
  entityManager.addComponent(
    cube,
    new BindGroup({
      layout: renderer.modelMatrixBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: modelMatrixBuffer.buffer,
        },
      ],
    })
  );
  entityManager.addComponent(cube, new Position(0, -1, -10));
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
