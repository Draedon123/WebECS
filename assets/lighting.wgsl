fn calculatePointLight(light: ptr<storage, PointLight>, normal: vec3f, fragmentPosition: vec3f) -> vec3f {
  let toFragment: vec3f = fragmentPosition - light.position;
  let lightDirection: vec3f = normalize(toFragment);
  let distanceSquared: f32 = dot(toFragment, toFragment);

  let diffuse: f32 = max(0.0, dot(lightDirection, normal));
  let intensity = light.intensity / distanceSquared;
  let diffuseLight: vec3f = diffuse * intensity * light.colour;

  return diffuseLight;
}
