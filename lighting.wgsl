fn calculatePointLight(light: ptr<storage, PointLight>, normal: vec3f, fragmentPosition: vec3f, inverseTBN: mat3x3f, shininess: f32, specularColour: vec3f) -> vec3f {
  let toLight: vec3f = inverseTBN * (light.position - fragmentPosition);
  let lightDirection: vec3f = normalize(toLight);
  let cameraDirection: vec3f = normalize(inverseTBN * (camera.position - fragmentPosition));
  let halfway: vec3f = normalize(lightDirection + cameraDirection);
  let distance = length(toLight);

  let diffuse: f32 = max(0.0, dot(lightDirection, normal));
  let specular: f32 = pow(max(dot(normal, halfway), 0.0), shininess);
  let normalised: f32 = distance / light.maxDistance;
  // https://lisyarus.github.io/blog/posts/point-light-attenuation.html
  let intensity = 
    step(normalised, 1.0) *
    light.intensity *
    (1.0 - normalised * normalised) *
    (1.0 - normalised * normalised) /
    (1.0 + light.decayRate * normalised * normalised);
  let resultantLight: vec3f = 
    diffuse * intensity * light.colour +
    specular * intensity * specularColour;

  return resultantLight;
}

fn calculateDirectionalLight(normal: vec3f, fragmentPosition: vec3f, inverseTBN: mat3x3f, shininess: f32, specularColour: vec3f) -> vec3f {
  let direction: vec3f = normalize(inverseTBN * directionalLight.direction);
  let cameraDirection: vec3f = normalize(inverseTBN * (camera.position - fragmentPosition));
  let halfway: vec3f = normalize(direction + cameraDirection);
  let diffuse: f32 = max(0.0, dot(direction, normal));
  let specular: f32 = pow(max(dot(normal, halfway), 0.0), shininess);

  return 
    diffuse * directionalLight.intensity * directionalLight.colour +
    specular * directionalLight.intensity * specularColour;
}
