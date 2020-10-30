# A basic WebGL .obj viewer

Using three.js to display an .obj file.

This object is a low-res photogrammetry scan from [Museum of East Asian Art](https://meaa.org.uk/) in Bath, taken around 2012 with a very basic setup.

## To do

- try the Three.js export from [Clara.io](https://clara.io/)
- make a generic version that will accept any obj file
- resize texture image to power of two e.g. 1024x1024
- work out how to resize the canvas element (in three.js: `c.width=Math.floor(a.width*b);c.height=Math.floor(a.height*b);`)

## Resources

- Tutorial [WebGL 3D Model Viewer Using three.js](https://manu.ninja/webgl-3d-model-viewer-using-three-js/)
- extra help from the [Three.js forum](https://discourse.threejs.org/)
