#!import lighting

struct Vertex {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) normal: vec3f,
  @location(2) worldPosition: vec4f,
}

struct ObjectTransforms {
  modelMatrix: mat4x4f,
  normalMatrix: mat3x3f,
}

struct AmbientLight {
  colour: vec3f,
  strength: f32,
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

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f; 
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var <uniform> ambientLight: AmbientLight;
@group(0) @binding(3) var <storage, read> pointLights: PointLights;

@group(1) @binding(0) var <uniform> objectTransforms: ObjectTransforms;
@group(1) @binding(1) var texture: texture_2d<f32>;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.worldPosition = objectTransforms.modelMatrix * vec4f(vertex.position, 1.0);
  output.position = perspectiveViewMatrix * output.worldPosition;
  output.uv = vertex.uv;
  output.normal = normalize(objectTransforms.normalMatrix * vertex.normal);

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColour: vec3f = textureSample(texture, textureSampler, input.uv).rgb;

  let ambient: vec3f = ambientLight.strength * ambientLight.colour;
  
  var pointLightContribution: vec3f = vec3f(0.0);

  for(var i: u32 = 0; i < pointLights.count; i++){
    pointLightContribution += calculatePointLight(&pointLights.lights[i], input.normal, input.worldPosition.xyz);
  }

  return vec4f((ambient + pointLightContribution) * textureColour, 1.0);
  // return vec4f(input.normal, 1.0);
}
