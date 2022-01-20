var materialShaders = [];
var speed = 10;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(0, 1.3, 7);
camera.lookAt(scene.position);
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
var canvas = renderer.domElement;
document.body.appendChild(canvas);

scene.background = new THREE.Color(0xffaa44);
console.log(scene.background);
scene.fog = new THREE.Fog(scene.background, 42.5, 50);

var controls = new THREE.OrbitControls(camera, canvas);
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minPolarAngle = Math.PI * 0.25;
controls.target.set(0, 1.8, 0);
controls.update();


// GROUND AND ROAD
var planeGeom = new THREE.PlaneBufferGeometry(100, 100, 200, 200);
planeGeom.rotateX(-Math.PI * 0.5);
var planeMat = new THREE.MeshBasicMaterial({
  color: 0xff00ee
});
planeMat.onBeforeCompile = shader => {
  shader.uniforms.time = { value: 0 };
  shader.vertexShader =
    `
    uniform float time;
    varying vec3 vPos;
  ` + noise + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
      vec2 tuv = uv;
      float t = time * 0.01 * ${speed}.;
      tuv.y += t;
      transformed.y = snoise(vec3(tuv * 5., 0.)) * 5.;
      transformed.y *= smoothstep(5., 15., abs(transformed.x)); // road stripe
      vPos = transformed;
    `
  );
  shader.fragmentShader =
    `
    #extension GL_OES_standard_derivatives : enable

    uniform float time;
    varying vec3 vPos;

    float line(vec3 position, float width, vec3 step){
      vec3 tempCoord = position / step;

      vec2 coord = tempCoord.xz;
      coord.y -= time * ${speed}. / 2.;

      vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord * width);
      float line = min(grid.x, grid.y);

      return min(line, 1.0);
    }
  ` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
    `
    float l = line(vPos, 2.0, vec3(2.0));
    vec3 base = mix(vec3(0, 0.75, 1), vec3(0), smoothstep(5., 7.5, abs(vPos.x)));
    vec3 c = mix(outgoingLight, base, l);
    gl_FragColor = vec4(c, diffuseColor.a);
    `
  );
  materialShaders.push(shader);
};
var plane = new THREE.Mesh(planeGeom, planeMat);
scene.add(plane);

// PALMS
var palmGeoms = [];
// log
var logGeom = new THREE.CylinderBufferGeometry(0.25, 0.125, 10, 5, 4, true);
logGeom.translate(0, 5, 0);
palmGeoms.push(logGeom);
// leaves
for (let i = 0; i < 20; i++) {
  let leafGeom = new THREE.CircleBufferGeometry(1.25, 4);
  leafGeom.translate(0, 1.25, 0);
  leafGeom.rotateX(-Math.PI * 0.5);
  leafGeom.scale(0.25, 1, THREE.Math.randFloat(1, 1.5));
  leafGeom.attributes.position.setY(0, 0.25);
  leafGeom.rotateX(THREE.Math.randFloatSpread(Math.PI * 0.5));
  leafGeom.rotateY(THREE.Math.randFloat(0, Math.PI * 2));
  leafGeom.translate(0, 10, 0);
  palmGeoms.push(leafGeom);
}
// merge
var palmGeom = THREE.BufferGeometryUtils.mergeBufferGeometries(palmGeoms, false);
palmGeom.rotateZ(THREE.Math.degToRad(-1.5));
// instancing
var instPalm = new THREE.InstancedBufferGeometry();
instPalm.attributes.position = palmGeom.attributes.position;
instPalm.attributes.uv = palmGeom.attributes.uv;
instPalm.index = palmGeom.index;
palmPos = [];
for (let i = 0; i < 5; i++) {
  palmPos.push(-5, 0, i * 20 - 10 - 50);
  palmPos.push(5, 0, i * 20 - 50);
}
instPalm.addAttribute(
  "instPosition",
  new THREE.InstancedBufferAttribute(new Float32Array(palmPos), 3)
);

var palmMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
palmMat.onBeforeCompile = shader => {
  shader.uniforms.time = { value: 0 };
  shader.vertexShader =
    `
    uniform float time;
    attribute vec3 instPosition;
  ` + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>

      transformed.x *= sign(instPosition.x); // flip
      vec3 ip = instPosition;
      ip.z = mod(50. + ip.z + time * ${speed}., 100.) - 50.;
      transformed *= 0.4 + smoothstep(50., 45., abs(ip.z)) * 0.6;
      transformed += ip;
    `
  );
  materialShaders.push(shader);
}
var palms = new THREE.Mesh(instPalm, palmMat);
scene.add(palms);

// SUN
var sunGeom = new THREE.CircleBufferGeometry(200, 64);
var sunMat = new THREE.MeshBasicMaterial({ color: 0xff8800, fog: false, transparent: true });
sunMat.onBeforeCompile = shader => {
  shader.uniforms.time = { value: 0 };
  shader.vertexShader =
    `
    varying vec2 vUv;
  ` + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
      vUv = uv;
    `
  );
  shader.fragmentShader = `
    varying vec2 vUv;
  ` + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace(
    `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
    `gl_FragColor = vec4( outgoingLight, diffuseColor.a * smoothstep(0.5, 0.7, vUv.y));`
  );

  materialShaders.push(shader);
}
var sun = new THREE.Mesh(sunGeom, sunMat);
sun.position.set(0, 0, -500);
scene.add(sun);


var clock = new THREE.Clock();
var time = 0;
render();

function render() {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  time = clock.getElapsedTime();
  materialShaders.forEach(m => {
    m.uniforms.time.value = time;
  });
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
