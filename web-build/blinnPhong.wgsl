#!import lighting

struct Vertex {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
  @location(3) tangent: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec4f,
  @location(3) _t: vec3f,
  @location(4) _b: vec3f,
  @location(5) _n: vec3f,
  @interpolate(flat)
  @location(6) hasNormalMap: u32,
}

struct ObjectData {
  modelMatrix: mat4x4f,
  normalMatrix: mat3x3f,
  hasNormalMap: u32,
}

struct AmbientLight {
  colour: vec3f,
  strength: f32,
}

struct DirectionalLight {
  @align(16) direction: vec3f,
  colour: vec3f,
  intensity: f32,
}

struct PointLights {
  @align(16) count: u32,
  lights: array<PointLight>,
}

struct PointLight {
  @align(16) position: vec3f,
  colour: vec3f,
  intensity: f32,
  maxDistance: f32,
  decayRate: f32,
}

struct Camera {
  perspectiveViewMatrix: mat4x4f,
  position: vec3f,
}

@group(0) @binding(0) var <uniform> camera: Camera; 
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var <uniform> ambientLight: AmbientLight;
@group(0) @binding(3) var <uniform> directionalLight: DirectionalLight;
@group(0) @binding(4) var <storage, read> pointLights: PointLights;

@group(1) @binding(0) var <uniform> objectData: ObjectData;
@group(1) @binding(1) var texture: texture_2d<f32>;

@group(2) @binding(0) var normalMap: texture_2d<f32>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  let normal: vec3f = normalize(objectData.normalMatrix * vertex.normal);
  let tangent: vec3f = normalize(objectData.normalMatrix * vertex.tangent.xyz);
  let bitangent: vec3f = normalize(cross(normal, tangent) * vertex.tangent.w);

  let inverseTBN: mat3x3f = transpose(mat3x3f(tangent, bitangent, normal));

  output.worldPosition = objectData.modelMatrix * vec4f(vertex.position, 1.0);
  output.position = camera.perspectiveViewMatrix * output.worldPosition;
  output.uv = vertex.uv;
  output.normal = normal;
  output._t = inverseTBN[0];
  output._b = inverseTBN[1];
  output._n = inverseTBN[2];
  output.hasNormalMap = objectData.hasNormalMap;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let inverseTBN: mat3x3f = mat3x3f(input._t, input._b, input._n);
  let normal = select(
    inverseTBN * input.normal,
    normalize(textureSample(normalMap, textureSampler, input.uv).rgb * 2.0 - 1.0),
    input.hasNormalMap == 1,
  );

  let textureColour: vec3f = textureSample(texture, textureSampler, input.uv).rgb;
  let ambient: vec3f = ambientLight.strength * ambientLight.colour;
  var pointLightContribution: vec3f = vec3f(0.0);

  for(var i: u32 = 0; i < pointLights.count; i++){
    pointLightContribution += calculatePointLight(&pointLights.lights[i], normal, input.worldPosition.xyz, inverseTBN);
  }

  let directional = calculateDirectionalLight(normal, input.worldPosition.xyz, inverseTBN);

  return vec4f((ambient + pointLightContribution + directional) * textureColour, 1.0);
  // return select(vec4f(0.0), vec4f((transpose(inverseTBN) * normal + 1.0) / 2.0, 1.0), input.hasNormalMap == 1);
  // return vec4f((transpose(inverseTBN) * normal + 1.0) / 2.0, 1.0);
}
