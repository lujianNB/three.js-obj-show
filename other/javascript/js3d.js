var container;

var camera, controls, scene, renderer;
var lighting, ambient, keyLight, fillLight, backLight;

init();
animate();

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  /* Camera */

  // THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 3;
  // no effect:
  // camera.fov = 60;


  /* Scene */

  scene = new THREE.Scene();
  lighting = false;

  ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
  keyLight.position.set(-100, 0, 100);

  fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
  fillLight.position.set(100, 0, 100);

  backLight = new THREE.DirectionalLight(0xffffff, 1.0);
  backLight.position.set(100, 0, -100).normalize();

  /* Model */

/*
use .setTexturePath( path ) for texture path
.setPath( path ) for general base path instead.
*/

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setTexturePath('./assets/');
  mtlLoader.setPath('./assets/');
  mtlLoader.load('ring1.mtl', function (materials) {

    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('./assets/');
    objLoader.load('Garen.obj', function (object) {
      object.scale.setScalar(0.005);
      scene.add(object);
    });
  });

  /* Renderer */

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color("#555"));

  container.appendChild(renderer.domElement);

  /* Controls */

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = false;

  /* Events */

  window.addEventListener('resize', onWindowResize, false);
  // window.addEventListener('keydown', onKeyboardEvent, false);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// function onKeyboardEvent(e) {

//     if (e.code === 'KeyL') {

//         lighting = !lighting;

//         if (lighting) {

//             ambient.intensity = 0.25;
//             scene.add(keyLight);
//             scene.add(fillLight);
//             scene.add(backLight);

//         } else {

//             ambient.intensity = 1.0;
//             scene.remove(keyLight);
//             scene.remove(fillLight);
//             scene.remove(backLight);

//         }

//     }

// }

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}
