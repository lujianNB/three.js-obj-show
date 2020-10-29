/**
 * ThreeJS object viewer lib
 * -------------------------
 * Our objective is to create a JS Library for displaying OBJ files in CollectiveAccess.
 * This library must be reusable.
 */

var container, stats;

var camera, scene, renderer, controls,
    boundingbox, sceneRadiusForCamera,
    plinth, cubeMaterial, objectCopy, rotate, axes,
    ambient, pointLight;

var size = new Array();

var timer, weight;

var axis = new THREE.Vector3(0, 1, 0);

var objLoader = new THREE.OBJLoader();

var mSettings;

var renderAnimateIDs = [];

function stopMeshRender() {
    try {
        var len = renderAnimateIDs.length;
        for (var i = 0; i < len; i++) {
            var animateID = renderAnimateIDs.shift();
            try {
                var rtn = clearInterval(animateID);
                // console.log('cancelRequestAnimationFrame success id: ' + animateID);
            } catch (e) {
                renderAnimateIDs.push(animateID);
                // console.log('cancelRequestAnimationFrame failed')
            }
        }
    } catch (e) {
    }

    // console.log('still run: ' + renderAnimateIDs);
}

var pb;
function meshviewer(settings) {

    stopMeshRender();

    try {
        scene.remove(obj);
    } catch (e) {
    }

    $(settings.container).html("");

    size_verif(settings);
}

var obj;
var textureMat;
var blankMat;
var isShowWire;
var isShoTexture;


var onLoad = function (object) {

    if (mSettings.success) {
        mSettings.success(true)
    }

    var xAxis = new THREE.Vector3(0, 1, 0);

    // Rotation on X Axis to reflect front face as shown in Meshlab
    object.rotateOnAxis(xAxis, 90 * Math.PI / 180);

    scene.add(object);

    boundingbox = new THREE.BoundingBoxHelper(object, 0xff0000);

    boundingbox.update();

    // Copy the object to a global variable, so that it's accessible from everyWhere in this code
    objectCopy = object;

    resetObjectPosition();

    sceneRadiusForCamera = Math.max(size.x, size.y, size.z) / 2 * (1 + Math.sqrt(5)); // golden number to beautify display

    // console.log(sceneRadiusForCamera);

    showFront();

    jQuery("#progress").hide();

    animate(mSettings);
};

var onProgress = function (object) {
    var progression = (object.loaded / object.total) * 100;

    try {
        //pb.show();
        //
        //if (progression == 100) {
        //
        //    pb.progressbar({
        //        value: false
        //    })
        //} else {
        //
        //    pb.progressbar({
        //        value: progression
        //    });
        //}
    } catch (e) {
    }

    // console.log(" total size:" + object.total + " position:" + object.loaded + " progress:" + progression);

};


function returnMtmSett() {
    return {
        wireframe: isShowWire ? true : false
        //ambient:0x262626,
        //specular:0x666666,
        //shininess:64,
    }
}

function init(settings) {
    isFistRender = true;
    mSettings = settings;
    isShowWire = settings.showWireframe;
    isShoTexture = settings.showTexture == undefined || settings.showTexture ? true : false;
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    //if(!renderer)
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize($(settings.container).width(), $(settings.container).height());

    //if(!scene)
    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog( 0x000000, 800, 2000 );

    // Add axes
    //if(!axes)
    axes = buildAxes(1000);

    //if(!camera)
    camera = new THREE.PerspectiveCamera(45, $(settings.container).width() / $(settings.container).height(), 1, 2000);

    controls = new THREE.TrackballControls(camera, $(settings.container)[0]);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.2;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;
    //controls.minDistance = 200;
    //controls.maxDistance = 1000;

    controls.keys = [65, 83, 68]; // [ rotateKey, zoomKey, panKey ]

    var ambientLight = new THREE.AmbientLight(0xdddddd, 0.4);
    scene.add(ambientLight);

    pointLight = new THREE.PointLight();
    camera.add(pointLight);
    scene.add(camera);


    /*___________________________________________________________________________

     OBJECT LOADING
     ___________________________________________________________________________
     */
    loadMTL(settings);

    jQuery(settings.container).html("");
    jQuery(settings.container).append(renderer.domElement);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    camera.lookAt(new THREE.Vector3(0, -1, 0));
}

function loadMTL(settings) {
    switch (settings.format) {
        case 'obj':
            // Overwriting OBJMTLLoader to allow progression monitoring
            objLoader.load = function (url, mtlurl, onLoad, onProgress, onError) {
                var scope = this;
                var mtlLoader = new THREE.MTLLoader(url.substr(0, Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\")) + 1));

                mtlLoader.load('', function (materials) {
                    blankMat = materials;
                    mtlLoader.load(mtlurl, function (materials) {
                        textureMat = materials;
                        textureMat.preload();
                        var loader = new THREE.FileLoader(scope.manager);
                        //loader.load = My_XHRLoader_load;
                        loader.load(url, function (text) {
                            obj = scope.parse(text);
                            changeObjStatus(textureMat, settings)
                            onLoad(obj);
                        }, onProgress, onError);

                    });
                });

            };

            objLoader.load(settings.meshFile, settings.mtlFile, onLoad, onProgress);
            break;
    }
}

function change2grid() {

    changeObjStatus(isShoTexture ? textureMat : blankMat, { wireframe: true });
    isShowWire = true;
}

function change2entity() {

    changeObjStatus(isShoTexture ? textureMat : blankMat, { wireframe: false });
    isShowWire = false;

}

function addTexture() {

    changeObjStatus(textureMat, { wireframe: isShowWire ? true : false });
    isShoTexture = true;

    pointLight.color.set(0xffffff);
    pointLight.intensity = 0.8;
}

function removeTexture() {

    changeObjStatus(blankMat, returnMtmSett());
    isShoTexture = false;

    pointLight.color.set(0x888888);
    pointLight.intensity = 0.6;

}

function changeObjStatus(mat, settings) {

    if (obj === undefined) {
        return;
    }
    scene.remove(obj);
    obj.traverse(function (object) {
        if (object instanceof THREE.Mesh) {
            if (object.material instanceof Array) {
                for (m in object.material) {
                    if (object.material[m].name) {
                        // var material = (settings.showTexture == undefined || settings.showTexture ? textureMat : blankMat).create(object.material.name);
                        var material = mat.create(object.material[m].name);
                        material.setValues(settings);
                        if (material) object.material[m] = material;

                    }
                }
            } else {
                var material = mat.create(object.material.name);
                material.setValues(settings);
                if (material) object.material = material;
            }
        }
    });
    scene.add(obj);

}

function onWindowResize() {
}

function onDocumentMouseMove(event) {
}

function addPlinth() {
    // Calculating plinth only if button toggled for performance issue
    if (plinth === undefined) {
        cubeMaterial = new THREE.MeshPhongMaterial({
            ambient: 0x030303,
            color: 0x222222,
            specular: 0x000512,
            shininess: 10,
            shading: THREE.FlatShading
        });
        //cubeMaterial.opacity = 0.6;
        //cubeMaterial.transparent = true;
        plinth = new THREE.Mesh(new THREE.BoxGeometry(
            (size.x),
            (size.y / 2),
            (size.z)
        ), cubeMaterial);
        // console.log(plinth);
        boundingbox.update();
        //scene.addObject( plinth );
        //plinth.computeBoundingBox();
        plinth.position.y = boundingbox.geometry.attributes.position.array[7] * 3 / 2;
        plinth.name = "plinth";
    }
    if (!scene.getObjectByName('plinth', true)) {
        //Adding plinth to scene if not already there
        scene.add(plinth);
    }
}

function removePlinth() {
    scene.remove(plinth);
}

function addAxes() {
    scene.add(axes);
}

function removeAxes() {
    scene.remove(axes);
}

function addBBox() {
    scene.add(boundingbox);
}

function removeBBox() {
    scene.remove(boundingbox);
}

/*  ___________________________________________________________________________

 Object Views
 ___________________________________________________________________________
 */

function showLeft() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.y = 0;
    camera.position.x = 0;
    camera.position.z = sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

function showRight() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.y = 0;
    camera.position.x = 0;
    camera.position.z = -sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

function showBack() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.z = 0;
    camera.position.y = 0;
    camera.position.x = -sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

function showFront() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.z = 0;
    camera.position.y = 0;
    camera.position.x = sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

function showTop() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.x = 0;
    camera.position.z = 0;
    camera.position.y = sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

function showBottom() {
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;
    controls.reset();
    camera.position.x = 0;
    camera.position.z = 0;
    camera.position.y = -sceneRadiusForCamera;
    camera.lookAt(scene.position);
}

/*  ___________________________________________________________________________

 Object translation
 ___________________________________________________________________________
 */
var scope = 10;
function translateRight() {
    objectCopy.translateX(1 * scope);
}

function translateLeft() {
    objectCopy.translateX(-1 * scope);
}

function translateUp() {
    objectCopy.translateZ(1 * scope);
}

function translateDown() {
    objectCopy.translateZ(-1 * scope);
}

function translateReset() {
    resetObjectPosition();
}

function resetObjectPosition() {
    boundingbox.update();

    // If you just want the numbers
    // console.log("box radius: " + boundingbox.geometry.boundingSphere.radius);

    size.x = boundingbox.geometry.attributes.position.array[0] - boundingbox.geometry.attributes.position.array[3];
    size.y = boundingbox.geometry.attributes.position.array[1] - boundingbox.geometry.attributes.position.array[7];
    size.z = boundingbox.geometry.attributes.position.array[2] - boundingbox.geometry.attributes.position.array[14];

    // console.log(size);

    // Repositioning object
    objectCopy.position.x = -boundingbox.geometry.attributes.position.array[3] - size.x / 2;
    objectCopy.position.y = -boundingbox.geometry.attributes.position.array[7] - size.y / 2;
    objectCopy.position.z = -boundingbox.geometry.attributes.position.array[14] - size.z / 2;

    boundingbox.update();
    if (objectCopy !== undefined) objectCopy.rotation.z = 0;

}

/*  ___________________________________________________________________________

 Zoom
 ___________________________________________________________________________
 */

function zoomIn() {
    camera.translateZ(-1 * 10);
}

function zoomOut() {
    camera.translateZ(1 * 10);
}

/*  ___________________________________________________________________________

 Rotation (Sphere)
 ___________________________________________________________________________
 */

function rotateRight() {
    var rotSpeed = .2;

    var x = camera.position.x,
        y = camera.position.y,
        z = camera.position.z;

    camera.position.x = x * Math.cos(rotSpeed) - z * Math.sin(rotSpeed);
    camera.position.z = z * Math.cos(rotSpeed) + x * Math.sin(rotSpeed);

    camera.lookAt(scene.position);
}

function rotateLeft() {
    var rotSpeed = .2;

    var x = camera.position.x,
        y = camera.position.y,
        z = camera.position.z;

    camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
    camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);

    camera.lookAt(scene.position);
}

function rotateLeftSlow() {
    var rotSpeed = .01;

    var x = camera.position.x,
        y = camera.position.y,
        z = camera.position.z;

    camera.position.x = x * Math.cos(rotSpeed) + z * Math.sin(rotSpeed);
    camera.position.z = z * Math.cos(rotSpeed) - x * Math.sin(rotSpeed);

    camera.lookAt(scene.position);
}

function animate(settings) {

    var renderAnimateID = setInterval(function () {
        render();
    }, 1000 / 50);
    renderAnimateIDs.push(renderAnimateID);
}

var isFistRender = true;

function render() {
    if (rotate) {
        // objectCopy.rotation.y += 0.01;
        rotateLeftSlow();
    }
    //console.log(scene.position);
    //controls.target(cameraTarget);
    controls.update(); //for cameras

    if (isFistRender && mSettings.showTexture == false) {
        removeTexture();
    }

    renderer.render(scene, camera);

    if (isFistRender) {
        // console.log("start render! ");

        if (mSettings.startRenderCb instanceof Function) {
            mSettings.startRenderCb();
        }
    }

    isFistRender = false;
}

function buildAxes(length) {
    var axes = new THREE.Object3D();

    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0), 0xFF0000, false)); // +X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-length, 0, 0), 0xFF0000, true)); // -X
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0), 0x00FF00, false)); // +Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0), 0x00FF00, true)); // -Y
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length), 0x0000FF, false)); // +Z
    axes.add(buildAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -length), 0x0000FF, true)); // -Z

    return axes;

}

function buildAxis(src, dst, colorHex, dashed) {
    var geom = new THREE.Geometry(),
        mat;

    if (dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }

    geom.vertices.push(src.clone());
    geom.vertices.push(dst.clone());
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line(geom, mat, THREE.LinePieces);

    return axis;

}

function rotateOn() {
    rotate = true;
}

function rotateOff() {
    rotate = false;
}


function size_verif(settings) {
    var mesh = settings.meshFile;

    var xhr = $.ajax({
        type: "HEAD",
        url: settings.meshFile,
        success: function (msg) {
            var size = xhr.getResponseHeader('Content-Length');
            size = parseInt(size);
            // console.log("size = " + size);

            if (size < 200 && settings.success) {
                settings.success(false);
                return;
            }
            init(settings);
        },
        error: function () {
            // console.log("load model failed ");
            if (settings.loadFailed instanceof Function) {
                settings.loadFailed();
            }
        }
    });
}

function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}


jQuery(document).ready(function () {
    jQuery(".buttons-detail").hide();
    jQuery(".buttons-header").click(function () {
        jQuery(this).parent().find(".buttons-detail").slideToggle();
    });
    jQuery("#face-buttons .buttons-detail").show();

});


// overwriting THREE.XHLLoading `s load method
var My_XHRLoader_load = function (url, onLoad, onProgress, onError) {

    var scope = this;

    var cached = scope.cache.get(url);

    if (cached !== undefined) {

        onLoad(cached);
        return;

    }

    var request = new XMLHttpRequest();

    if (onLoad !== undefined) {

        request.addEventListener('load', function (event) {

            scope.cache.add(url, event.target.responseText);

            onLoad(event.target.responseText);
            scope.manager.itemEnd(url);

        }, false);

    }

    if (onProgress !== undefined) {

        request.addEventListener('progress', function (event) {

            onProgress(event);

        }, false);

    }

    if (onError !== undefined) {

        request.addEventListener('error', function (event) {

            onError(event);

        }, false);

    }

    if (this.crossOrigin !== undefined) request.crossOrigin = this.crossOrigin;

    request.open('GET', url, true);
    request.send(null);

    scope.manager.itemStart(url);

};
