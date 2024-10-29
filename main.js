import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 4

const renderer = new THREE.WebGLRenderer({ 
  canvas : document.querySelector('#canvas'),
  antialias : true,
  alpha : true
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputEncoding = THREE.sRGBEncoding

// Create EffectComposer
const composer = new EffectComposer(renderer)

// Add RenderPass
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

// Add RGBShiftShader
const rgbShiftPass = new ShaderPass(RGBShiftShader)

const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()

// Create OrbitControls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Variable to store the loaded model
let loadedModel

new RGBELoader()
  .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/satara_night_4k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    scene.environment = envMap
    texture.dispose()
    pmremGenerator.dispose()

    // Add GLTF model loading
    const loader = new GLTFLoader()
    loader.load(
      './DamagedHelmet.gltf',
      (gltf) => {
        loadedModel = gltf.scene
        scene.add(loadedModel)
        console.log('Model loaded successfully')
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
      },
      (error) => {
        console.error('An error happened while loading the model', error)
      }
    )
  }, undefined, function(error) {
    console.error('An error happened while loading the HDRI', error)
  })

// Mouse movement handler
function onMouseMove(event) {
  if (loadedModel) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1

    // Adjust the model's rotation based on mouse position with opposite axes
    loadedModel.rotation.y = mouseX * Math.PI / 4
    loadedModel.rotation.x = -mouseY * Math.PI / 4
  }
}

// Add mouse move event listener
window.addEventListener('mousemove', onMouseMove)

function animate() {
  window.requestAnimationFrame(animate)
  controls.update()
  composer.render() // Use composer instead of renderer
}
animate()

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight) // Update composer size
})