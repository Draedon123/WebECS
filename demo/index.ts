import { createSphereMesh } from "src/core/meshes/createSphereMesh";
import { DirectionalLight } from "src/core/rendering/scene/DirectionalLight";
import {
  AmbientLight,
  EntityManager,
  Light,
  lookAt,
  Loop,
  MeshReference,
  PerspectiveCamera,
  PointLight,
  Position,
  Renderer,
  Rotation,
  Scale,
  Skybox,
  Texture,
  TextureReference,
  Vector3,
} from "webecs";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const renderer = await Renderer.create(canvas);
  const entityManager = EntityManager.getInstance();

  await renderer.initialise();
  renderer.settings.clearColour = [0.1, 0.1, 0.1, 1];

  const cameraComponent = new PerspectiveCamera({});
  const cameraPosition = new Position(0, 3, 10);
  const camera = entityManager.createEntity(
    cameraComponent,
    cameraPosition,
    new Rotation(0, 0, 0)
  );

  await renderer.resourceManager.loadModel(
    import.meta.env.BASE_URL + "/web-assets/iss/ISS_stationary.obj.gz",
    "ISS",
    "obj"
  );
  const iss = renderer.resourceManager.spawnModel("ISS");
  const issRotation = new Rotation();

  entityManager.addComponent(iss, new Position(0, 0, 0));
  entityManager.addComponent(iss, new Scale(0.1));
  entityManager.addComponent(iss, issRotation);

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 0.2),
    new AmbientLight()
  );
  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 0.4),
    new DirectionalLight(new Vector3(0, 1, 0))
  );

  const skyboxTexture = await Texture.createCubemap(
    import.meta.env.BASE_URL + "/web-assets/skybox"
  );

  renderer.resourceManager.addTexture("Skybox", skyboxTexture);
  entityManager.createEntity(new Skybox(), new TextureReference("Skybox"));

  const planetTextures = [
    "Alpine",
    "Gaseous1",
    "Gaseous2",
    "Gaseous3",
    "Gaseous4",
    "Icy",
    "Martian",
    "Savannah",
    "Swamp",
    "Terrestrial1",
    "Terrestrial2",
    "Terrestrial3",
    "Terrestrial4",
    "Tropical",
    "Venusian",
    "Volcanic",
  ];

  await Promise.all(
    planetTextures.map(async (planet) => {
      const texture = await Texture.fetch([
        import.meta.env.BASE_URL + `/web-assets/planets/${planet}.png`,
      ]);
      renderer.resourceManager.addTexture(planet, texture);
    })
  );

  const sphereMesh = createSphereMesh(7, 1);
  renderer.resourceManager.addMesh(
    "Sphere",
    sphereMesh.vertices,
    sphereMesh.indices
  );

  const ASTEROID_COUNT = 20;

  for (let i = 0; i < ASTEROID_COUNT; i++) {
    entityManager.createEntity(
      new MeshReference("Sphere"),
      new TextureReference(
        planetTextures[Math.floor(random(0, planetTextures.length))]
      ),
      new Position(
        Math.sign(Math.random() - 0.5) * random(10, 50),
        Math.sign(Math.random() - 0.5) * random(-10, 10),
        Math.sign(Math.random() - 0.5) * random(10, 50)
      ),
      // new Scale(random(0.3, 0.5)),
      new Rotation(random(0, 360), random(0, 360), random(0, 360))
    );
  }

  function random(min: number, max: number): number {
    return (max - min) * Math.random() + min;
  }

  entityManager.createEntity(
    new Light(new Vector3(255, 255, 255), 0.3),
    new PointLight(100, 0),
    cameraPosition
  );

  const loop = new Loop();

  let issRotationX = 0;
  let issRotationY = 0;
  let issRotationZ = 0;
  loop.addCallback((frame) => {
    issRotationX += frame.deltaTime * 1e-3;
    issRotationY -= frame.deltaTime * 0.5e-3;
    issRotationZ += frame.deltaTime * 2e-3;

    cameraPosition.x = 10 * Math.sin(frame.totalTime * 1e-4);
    cameraPosition.z = 10 * Math.cos(frame.totalTime * 1e-4);

    issRotation.setEulerAngles(issRotationX, issRotationY, issRotationZ);

    lookAt(camera, new Vector3(0, 0, 0));

    renderer.render(camera);
  });

  const loadingElement = document.getElementById("loading");
  loadingElement?.remove();

  loop.start();
}

main();
