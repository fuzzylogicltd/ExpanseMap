import "./main.css";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";
import * as TWEEN from "@tweenjs/tween.js";
import bodies from "./bodies.json";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

const loader = new GLTFLoader();

// locations
const texturesFolder = "assets/textures/";
const modelsFolder = "assets/models/";

// environment
const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const camera = new THREE.PerspectiveCamera(70, 2, 0.1, 1000);
const scene = new THREE.Scene();

// background stars
const spaceTexture = new THREE.TextureLoader().load(
  texturesFolder + "space.jpg"
);
scene.background = spaceTexture;

// camera position TEMP
camera.position.set(-20, 20, 20);
camera.up.set(0, 1, 0);
camera.lookAt(0, 0, 0);

// rotating elements array
const rotatingBodies = [];
let flagActiveCamera = true;
const localSpaceCameraPosition = new THREE.Vector3(-5, 2, 5);

// solar system
const solarSystem = new THREE.Object3D();
scene.add(solarSystem);

// HELPERS
// const gridHelper = new THREE.GridHelper(200,50);
// scene.add(gridHelper);
const controls = new OrbitControls(camera, renderer.domElement);

// shortcut controls
document.querySelectorAll("#shortcuts button").forEach((item) => {
  item.addEventListener("click", (event) => {
    moveCamera(item.innerHTML);
    document
      .getElementById("currentbody")
      .setAttribute("value", item.innerHTML);
  });
});

// make sun
makeSun();

// and bodies (planets moons and manmade)
bodies
  .filter((body) => body.parent === 0)
  .forEach((body) => {
    if (body.model === "") {
      makeBody(body);
    } else {
      makeModel(body);
    }
  });

//makeTycho();

// add stars
// makeStars();

// create belt
let angle = 0; // In degrees
//addAsteroids();
initMesh();

//run
requestAnimationFrame(animate);
console.log(solarSystem);

function addAsteroids() {
  let asteroidInstance = new THREE.Object3D();
  //let itemCount = 10;

  loader.load(
    modelsFolder + "eros.glb",
    function (gltf) {
      const asteroid = gltf.scene.children[0].geometry;
    },
    function (xhr) {
      // load progress
      // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function (error) {
      console.log("An error happened", error);
    }
  );

  Array(360)
    .fill()
    .forEach(() => {
      let [x, z] = pointsOnCircle({ radius: 20, angle: angle++, cx: 0, cy: 0 });
      const y = getRandomInt(-10, 10);

      x += getRandomInt(-10, 10);
      z += getRandomInt(-10, 10);

      asteroid.rotateX(getRandomInt(0, 360));
      asteroid.rotateY(getRandomInt(0, 360));
      asteroid.rotateZ(getRandomInt(0, 360));
      asteroid.position.set(x, y, z);
      scene.add(asteroid);
      console.log(asteroid);
    });

  // asteroid.position.set(x,y,z);
  // scene.add(asteroid);
  // console.log(x,y,z, angle);
}

function initMesh() {
  let geometry, material;

  loader.load(
    modelsFolder + "eros.glb",
    function (gltf) {
      material = new THREE.MeshNormalMaterial();
      geometry = gltf.scene.children[0];
      //makeInstanced(geometry, material, 20);

      console.log("geometry", geometry);
      console.log("material", material);
    },
    function (xhr) {
      // load progress
      // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function (error) {
      console.log("An error happened", error);
    }
  );

  // loader
  // .setPath(modelsFolder)
  // .load('suzanne.json', function(geometry){

  //     material = new THREE.MeshNormalMaterial();
  //     geometry.computeVertexNormals();

  //     makeInstanced(geometry, material, 20);

  // })
}

function makeInstanced(geometry, material, instanceCount) {
  const matrix = new THREE.Matrix4();
  const mesh = new THREE.InstancedMesh(geometry, material, instanceCount);

  for (let i = 0; i < instanceCount; i++) {
    randomizeMatrix(matrix);
    mesh.setMatrixAt(i, matrix);
  }

  scene.add(mesh);
}

const randomizeMatrix = (function () {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  return function (matrix) {
    position.x = Math.random() * 40 - 20;
    position.y = Math.random() * 40 - 20;
    position.z = Math.random() * 40 - 20;

    rotation.x = Math.random() * 2 * Math.PI;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = Math.random() * 2 * Math.PI;

    quaternion.setFromEuler(rotation);

    scale.x = scale.y = scale.z = Math.random() * 1;

    matrix.compose(position, quaternion, scale);
  };
})();

function makeModel(body) {
  loader.load(
    modelsFolder + body.model,
    function (gltf) {
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.rotateX(13);

      placeBody(gltf.scene, body);
    },
    function (xhr) {
      // load progress
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened");
    }
  );
}

function makeBody(body) {
  // shape
  const sphereGeometry = new THREE.SphereGeometry(body.radius, 36, 36);

  //texture
  const Texture = new THREE.TextureLoader().load(
    texturesFolder + body.name + ".jpg"
  );
  const BumpMap = new THREE.TextureLoader().load(
    texturesFolder + body.name + "_bump.jpg"
  );
  const SpecMap = new THREE.TextureLoader().load(
    texturesFolder + body.name + "_spec.jpg"
  );

  const planetMaterial = new THREE.MeshPhongMaterial({
    map: Texture,
    bumpMap: BumpMap,
    bumpScale: 0.02,
    specularMap: SpecMap,
    specular: new THREE.Color("grey"),
    shininess: 7,
  });

  // object
  const bodyMesh = new THREE.Mesh(sphereGeometry, planetMaterial);
  bodyMesh.name = body.name;

  placeBody(bodyMesh, body);
}

function placeBody(bodyMesh, body) {
  //clouds
  const CloudMap = new THREE.TextureLoader().load(
    texturesFolder + body.name + "_clouds.png"
  );
  const cloudsSphere = new THREE.Mesh(
    new THREE.SphereGeometry(body.radius + 0.03, 32, 32),
    new THREE.MeshPhongMaterial({
      map: CloudMap,
      transparent: true,
    })
  );

  // orbit
  const bodyOrbit = new THREE.Object3D();
  bodyOrbit.name = body.name + "Orbit";

  // add to system
  if (body.parent !== 0) {
    solarSystem.children[body.parent].add(bodyOrbit);
  } else {
    solarSystem.add(bodyOrbit);
  }

  // local position
  const arrDistanceFromParent = body.distanceFromParent.split(",");
  bodyOrbit.position.x = arrDistanceFromParent[0];
  bodyOrbit.position.y = arrDistanceFromParent[1];
  bodyOrbit.position.z = arrDistanceFromParent[2];

  bodyOrbit.add(bodyMesh);
  bodyOrbit.add(cloudsSphere);
  rotatingBodies.push(bodyMesh);
  rotatingBodies.push(cloudsSphere);

  // add satellites
  bodies
    .filter((subBody) => subBody.parent === body.id)
    .forEach((subBody) => {
      subBody.model === "" ? makeBody(subBody) : makeModel(subBody);
    });
}

function makeSun() {
  const Texture = new THREE.TextureLoader().load(texturesFolder + "sun.jpg");
  const sunMaterial = new THREE.MeshLambertMaterial({
    map: Texture,
    emissiveMap: Texture,
    emissive: new THREE.Color(1, 1, 1),
  });

  const sphereGeometry = new THREE.SphereGeometry(5, 36, 36);
  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  solarSystem.add(sunMesh);

  // light source
  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.PointLight(color, intensity);
  scene.add(light);
}

function makeStars() {
  const starsTexture = new THREE.ImageUtils.loadTexture("img/space2.jpg");

  starsTexture.wrapS = starsTexture.wrapT = THREE.RepeatWrapping;
  starsTexture.offset.set(0, 0);
  starsTexture.repeat.set(2, 2);

  const starsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1001, 64, 64),
    new THREE.MeshBasicMaterial({
      map: starsTexture,
      side: THREE.BackSide,
    })
  );

  solarSystem.add(starsMesh);
}

function moveCamera(targetIndex) {
  var targetPosition = getBodyLocation(getCurrentBody(targetIndex));

  // adjustments for rotating solar system
  // const offsetX = targetPosition.x;
  // const offsetY = targetPosition.y;
  // const offsetZ = targetPosition.z;

  // const offsetTargetPosition = new THREE.Vector3(offsetX, offsetY, offsetZ);

  tweenCameraOrientation(targetPosition);
}

function tweenCameraOrientation(targetPosition) {
  const startRotation = new THREE.Euler().copy(camera.rotation);
  camera.lookAt(targetPosition);
  const endRotation = new THREE.Euler().copy(camera.rotation);
  camera.rotation.copy(startRotation);

  flagActiveCamera = false;
  new TWEEN.Tween(camera.rotation)
    .to({ x: endRotation.x, y: endRotation.y, z: endRotation.z }, 500)
    .onComplete(() => {
      tweenCameraPosition(targetPosition);
      //flagActiveCamera = false;
    })
    .start();
}

function tweenCameraPosition(targetPosition) {
  const currentBody = document.getElementById("currentbody").value;

  let globalStartPos = new THREE.Vector3(); // start global pos
  let globalEndPos = new THREE.Vector3(); // target global pos

  camera.getWorldPosition(globalStartPos); // get global start pos

  // get global end pos:
  getCurrentBody(currentBody).add(camera);
  // solarSystem.children[currentBody].add(camera);          // add camera to target orbit
  camera.position.copy(localSpaceCameraPosition); // set camera location inside target orbit
  camera.getWorldPosition(globalEndPos); // save that position and target position (in global space)

  camera.position.copy(globalStartPos); // move camera to starting spot but in global space

  solarSystem.add(camera);

  new TWEEN.Tween(globalStartPos)
    .to(globalEndPos, 1000)
    .onStart(() => {
      flagActiveCamera = false;
    })
    .onUpdate(() => {
      camera.lookAt(targetPosition);
      camera.position.copy(globalStartPos);
    })
    .onComplete(() => {
      getCurrentBody(currentBody).add(camera);
      camera.position.copy(localSpaceCameraPosition);
      flagActiveCamera = true;
    })
    .start();

  flagActiveCamera = true;
}

function positionCamera(targetIndex) {
  const cameraTarget = getCurrentBodyLocation(targetIndex);
  camera.lookAt(cameraTarget);

  camera.position.copy(localSpaceCameraPosition);
}

function getCurrentBody(targetIndex) {
  const arrTarget = targetIndex.split(".");
  let currTarget = solarSystem;

  arrTarget.forEach((targetIndex) => {
    currTarget = currTarget.children[targetIndex];
  });

  return currTarget;
}

function getBodyLocation(targetObj) {
  const worldPosition = new THREE.Vector3();
  const objectWorldPosition = targetObj.getWorldPosition(worldPosition);

  return objectWorldPosition;
}

function animate(time) {
  time *= 0.00005;

  rotatingBodies.forEach((obj) => {
    obj.rotation.y = time;
  });

  renderer.render(scene, camera);
  TWEEN.update(); // ??

  requestAnimationFrame(animate);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const currBody = document.getElementById("currentbody").value;

  // if (flagActiveCamera === true) {
  //     positionCamera(currBody);
  //     console.log("autpos");
  // }
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pointsOnCircle({ radius, angle, cx, cy }) {
  angle = angle * (Math.PI / 180);
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  return [x, y];
}
