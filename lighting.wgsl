fn calculatePointLight(light: ptr<storage, PointLight>, normal: vec3f, fragmentPosition: vec3f) -> vec3f {
  let toLight: vec3f = light.position - fragmentPosition;
  let lightDirection: vec3f = normalize(toLight);
  let distance = length(toLight);

  let diffuse: f32 = max(0.0, dot(lightDirection, normal));
  let normalised: f32 = distance / light.maxDistance;
  // https://lisyarus.github.io/blog/posts/point-light-attenuation.html
  let intensity = 
    step(normalised, 1.0) *
    light.intensity *
    (1.0 - normalised * normalised) *
    (1.0 - normalised * normalised) /
    (1.0 + light.decayRate * normalised * normalised);
  let diffuseLight: vec3f = diffuse * intensity * light.colour;

  return diffuseLight;
}
