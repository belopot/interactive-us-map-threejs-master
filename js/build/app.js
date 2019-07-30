// MapPoint ----------------------------------------------------------------

function MapPoint( idx, x, y, z ) {
	this.idx = idx;
	this.connection = [];
	this.fired = false;
	this.color = "#ffffff";
	THREE.Vector3.call( this, x, y, z );
}

MapPoint.prototype = Object.create( THREE.Vector3.prototype );

MapPoint.prototype.connectPointTo = function ( pointB ) {

	var pointA = this;
	// create mapline and establish connection
	var mapLine = new MapLine( pointA, pointB );
	pointA.connection.push( mapLine );
	pointB.connection.push( mapLine );
	return mapLine;

};

MapPoint.prototype.createSignal = function ( ) {

	var signals = [];
	
	return signals;

};

MapPoint.prototype.reset = function () {
	this.fired = false;
};

// Traffic ----------------------------------------------------------------

function Traffic( x, y, z, size, color, label) {
	this.size = size;
	this.color = color;
	this.label = label;
	THREE.Vector3.call( this, x, y, z );
}

Traffic.prototype = Object.create( THREE.Vector3.prototype );


// Firework object
// constructor 
function Firework(parentObj, pos, size, color, duration, label) {
    this.parentObj = parentObj;
    this.dest = [];
    this.geometry = null;
    this.points = null;

    this.uniforms = {
        sizeMultiplier: {
            type: 'f',
            value: 5
        },
        opacity: {
            type: 'f',
            value: 1
        },
        texture: {
            type: 't',
            value: TEXTURES.spark5
        }
    };

    this.attributes = {
        color: {
            type: 'c',
            value: []
        },
        size: {
            type: 'f',
            value: []
        }
    };

    this.material = new THREE.ShaderMaterial({

        uniforms: this.uniforms,
        attributes: this.attributes,
        vertexShader: SHADER_CONTAINER.fireworkVert,
        fragmentShader: SHADER_CONTAINER.fireworkFrag,
        blending: currentBlendingMode,
        transparent: true,
        depthTest: false

    });


    this.uniformsChild = {
        sizeMultiplier: {
            type: 'f',
            value: 3
        },
        opacity: {
            type: 'f',
            value: 0.8
        },
        texture: {
            type: 't',
            value: TEXTURES.spark5
        }
    };

    this.attributesChild = {
        color: {
            type: 'c',
            value: []
        },
        size: {
            type: 'f',
            value: []
        }
    };

    this.materialChild = new THREE.ShaderMaterial({

        uniforms: this.uniformsChild,
        attributes: this.attributesChild,
        vertexShader: SHADER_CONTAINER.fireworkVert,
        fragmentShader: SHADER_CONTAINER.fireworkFrag,
        blending: currentBlendingMode,
        transparent: true,
        depthTest: false

    });


    this.duration = duration;
    this.timer = 0;
    this.position = pos;
    this.fireHeight = 20;
    this.fireRadius = 5;
    this.size = size;
    this.color = new THREE.Color(color);;
    this.launch();
};
Firework.prototype.reset = function () {
    this.parentObj.remove(this.points);
    this.dest = [];
    this.geometry = null;
    this.points = null;
    this.material.opacity = 1;
    this.material.colorsNeedUpdate = true;
}
Firework.prototype.launch = function () {
    var from = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    var to = new THREE.Vector3(this.position.x, this.position.y + this.fireHeight, this.position.z);

    // set mappoint attributes value
    this.attributes.color.value = [];
    this.attributes.size.value = [];
    this.attributes.color.value[0] = this.color;
    this.attributes.size.value[0] = this.size * 3;

    this.geometry = new THREE.Geometry();
    this.points = new THREE.PointCloud(this.geometry, this.material);

    this.geometry.vertices.push(from);
    this.dest.push(to);
    this.parentObj.add(this.points);
}
Firework.prototype.explode = function (vector) {
    this.parentObj.remove(this.points);
    this.dest = [];

    this.geometry = new THREE.Geometry();

    for (var i = 0; i < 20; i++) {


        var from = new THREE.Vector3(
            vector.x,
            vector.y,
            vector.z
        );
        var to = new THREE.Vector3(
            THREE.Math.randFloat(vector.x - this.fireRadius, vector.x + this.fireRadius),
            THREE.Math.randFloat(vector.y - this.fireRadius, vector.y + this.fireRadius),
            THREE.Math.randFloat(vector.z - this.fireRadius, vector.z + this.fireRadius)
        );
        this.geometry.vertices.push(from);
        this.dest.push(to);
    }

    for (var i = 0; i < this.geometry.vertices.length; i++) {
        this.attributesChild.color.value[i] = this.color;
        this.attributesChild.size.value[i] = this.size * 2;
    }

    this.points = new THREE.PointCloud(this.geometry, this.materialChild);
    this.parentObj.add(this.points);
}
Firework.prototype.update = function (deltaTime) {
    this.timer += deltaTime;
    if (this.timer > this.duration) {
        this.reset();
        this.launch();
        this.timer = 0;
    }
    // only if objects exist
    if (this.points && this.geometry) {
        var total = this.geometry.vertices.length;

        // lerp particle positions 
        for (var i = 0; i < total; i++) {
            this.geometry.vertices[i].x += (this.dest[i].x - this.geometry.vertices[i].x) / 60;
            this.geometry.vertices[i].y += (this.dest[i].y - this.geometry.vertices[i].y) / 60;
            this.geometry.vertices[i].z += (this.dest[i].z - this.geometry.vertices[i].z) / 60;
            this.geometry.verticesNeedUpdate = true;
        }
        // watch first particle for explosion 
        if (total === 1) {
            if (Math.ceil(this.geometry.vertices[0].y) > this.dest[0].y - 2) {
                this.explode(this.geometry.vertices[0]);
                return;
            }
        }
        // fade out exploded particles 
        if (total > 1) {
            this.material.opacity -= 0.015;
            this.material.colorsNeedUpdate = true;
        }
    }
}
function CommentLabel(label, targetObj) {
  this.div = document.createElement('div');
  this.div.style.position = 'absolute';
  this.div.innerHTML = label;
  this.div.style.top = -1000;
  this.div.style.left = -1000;
  this.div.style.color = '#ffffff';
  this.div.style.fontSize = '16px';
  this.div.classList.add('comment-label');
  this.parent = targetObj;
  this.position = new THREE.Vector3(0, 0, 0);
  container.appendChild(this.div);

}

CommentLabel.prototype.setHTML = function (html) {
  this.div.innerHTML = html;
}

CommentLabel.prototype.setParent = function (threejsobj) {
  this.parent = threejsobj;
}

CommentLabel.prototype.updatePosition = function () {
  if (this.parent) {
    var pos = new THREE.Vector3(this.parent.position.x, this.parent.position.y, this.parent.position.z);
    this.position.copy(pos);
  }

  var coords2d = this.get2DCoords();
  this.div.style.left = coords2d.x - this.div.offsetWidth / 2 + 'px';
  this.div.style.top = coords2d.y - this.div.offsetHeight - 5 + 'px';
}

CommentLabel.prototype.get2DCoords = function () {
  var vector = this.position.project(camera);
  vector.x = (vector.x + 1) / 2 * window.innerWidth;
  vector.y = -(vector.y - 1) / 2 * window.innerHeight;
  return vector;
}
// MapLine extends THREE.CubicBezierCurve3 ------------------------------------------------------------------
/* exported MapLine, Connection */

function MapLine(pointA, pointB) {
	this.bezierSubdivision = 8;
	this.pointA = pointA;
	this.pointB = pointB;
	this.cpLength = pointA.distanceTo(pointB) / THREE.Math.randFloat(1.5, 4.0);
	this.controlPointA = this.getControlPoint(pointA, pointB);
	this.controlPointB = this.getControlPoint(pointB, pointA);
	THREE.CubicBezierCurve3.call(this, this.pointA, this.controlPointA, this.controlPointB, this.pointB);

	this.vertices = this.getSubdividedVertices();
}

MapLine.prototype = Object.create(THREE.CubicBezierCurve3.prototype);

MapLine.prototype.getSubdividedVertices = function () {
	return this.getSpacedPoints(this.bezierSubdivision);
};

// generate uniformly distribute vector within x-theta cone from arbitrary vector v1, v2
MapLine.prototype.getControlPoint = function (v1, v2) {

	var dirVec = new THREE.Vector3().copy(v2).sub(v1).normalize();
	var northPole = new THREE.Vector3(0, 0, 1); // this is original axis where point get sampled
	var axis = new THREE.Vector3().crossVectors(northPole, dirVec).normalize(); // get axis of rotation from original axis to dirVec
	var axisTheta = dirVec.angleTo(northPole); // get angle
	var rotMat = new THREE.Matrix4().makeRotationAxis(axis, axisTheta); // build rotation matrix

	var minz = Math.cos(THREE.Math.degToRad(45)); // cone spread in degrees
	var z = THREE.Math.randFloat(minz, 1);
	var theta = THREE.Math.randFloat(0, Math.PI * 2);
	var r = Math.sqrt(1 - z * z);
	var cpPos = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z);
	cpPos.multiplyScalar(this.cpLength); // length of cpPoint
	cpPos.applyMatrix4(rotMat); // rotate to dirVec
	cpPos.add(v1); // translate to v1
	return cpPos;

};

// Map Network --------------------------------------------------------

function MapNetwork() {

	this.initialized = false;

	this.settings = {
		verticesSkipStep: 2,
		maxLineDist: 3,
		maxConnectinosPerPoint: 6,
	};

	this.meshComponents = new THREE.Object3D();

	// NN component containers
	this.components = {
		mapPoints: [],
		mapLines: [],
		traffics: []
	};

	// map line
	this.mapLineOpacityMultiplier = 0.1;
	this.mapLineColor = '#14d5ff';
	this.mapLineGeom = new THREE.BufferGeometry();
	this.mapLinePositions = [];
	this.mapLineIndices = [];
	this.mapLineNextPositionsIndex = 0;

	this.mapLineUniforms = {
		color: {
			type: 'c',
			value: new THREE.Color(this.mapLineColor)
		},
		opacityMultiplier: {
			type: 'f',
			value: this.mapLineOpacityMultiplier
		}
	};

	this.mapLineAttributes = {
		opacity: {
			type: 'f',
			value: []
		}
	};

	// mappoint
	this.mapPointSizeMultiplier = 0.1;
	this.spriteTextureMapPoint = TEXTURES.circle;
	this.mapPointColor = '#ffffff';
	this.mapPointOpacity = 0.2;
	this.mapPointGeom = new THREE.Geometry();

	this.mapPointUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: this.mapPointSizeMultiplier
		},
		opacity: {
			type: 'f',
			value: this.mapPointOpacity
		},
		texture: {
			type: 't',
			value: this.spriteTextureMapPoint
		}
	};

	this.mapPointAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.mapPointShaderMaterial = new THREE.ShaderMaterial({

		uniforms: this.mapPointUniforms,
		attributes: this.mapPointAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		transparent: true,
		depthTest: false

	});


	// traffic
	this.trafficGeom = new THREE.Geometry();

	this.trafficUniforms = {
		sizeMultiplier: {
			type: 'f',
			value: 3
		},
		opacity: {
			type: 'f',
			value: 0.8
		},
		texture: {
			type: 't',
			value: TEXTURES.circle
		}
	};

	this.trafficAttributes = {
		color: {
			type: 'c',
			value: []
		},
		size: {
			type: 'f',
			value: []
		}
	};

	this.trafficShaderMaterial = new THREE.ShaderMaterial({

		uniforms: this.trafficUniforms,
		attributes: this.trafficAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		transparent: true,
		depthTest: false

	});

	// firework
	this.fireworks = [];




	// initialize NN
	this.initNeuralNetwork();

}

MapNetwork.prototype.initNeuralNetwork = function () {

	this.initMapPoints(OBJ_MODELS.usmap.geometry.vertices);
	this.initMapLines();
	this.initTraffic();
	this.initFirework();

	this.mapPointShaderMaterial.vertexShader = SHADER_CONTAINER.mappointVert;
	this.mapPointShaderMaterial.fragmentShader = SHADER_CONTAINER.mappointFrag;

	this.mapLineShaderMaterial.vertexShader = SHADER_CONTAINER.maplineVert;
	this.mapLineShaderMaterial.fragmentShader = SHADER_CONTAINER.maplineFrag;

	this.trafficShaderMaterial.vertexShader = SHADER_CONTAINER.mappointVert;
	this.trafficShaderMaterial.fragmentShader = SHADER_CONTAINER.mappointFrag;

	this.initialized = true;

};

MapNetwork.prototype.initMapPoints = function (inputVertices) {

	//Make mappoint from model data
	var staticMapPointId = 0;
	for (var i = 0; i < inputVertices.length; i += this.settings.verticesSkipStep) {
		var pos = inputVertices[i];
		var n = new MapPoint(staticMapPointId++, pos.x, pos.y, pos.z);
		this.components.mapPoints.push(n);
		this.mapPointGeom.vertices.push(n);
		// dont set mappoint's property here because its skip vertices
	}


	// set mappoint attributes value
	for (var i = 0; i < this.components.mapPoints.length; i++) {
		this.mapPointAttributes.color.value[i] = new THREE.Color('#ffffff'); // initial mappoint color
		this.mapPointAttributes.size.value[i] = THREE.Math.randFloat(0.75, 3.0); // initial mappoint size
	}


	// mappoint mesh
	this.mapPointParticles = new THREE.PointCloud(this.mapPointGeom, this.mapPointShaderMaterial);
	this.meshComponents.add(this.mapPointParticles);

	this.mapPointShaderMaterial.needsUpdate = true;

};

MapNetwork.prototype.initMapLines = function () {

	var allMapPointsLength = this.components.mapPoints.length;
	for (var j = 0; j < allMapPointsLength; j++) {
		var n1 = this.components.mapPoints[j];
		for (var k = j + 1; k < allMapPointsLength; k++) {
			var n2 = this.components.mapPoints[k];
			// connect mappoint if distance is within threshold and limit maximum connection per mappoint
			if (n1 !== n2 && n1.distanceTo(n2) < this.settings.maxLineDist &&
				n1.connection.length < this.settings.maxConnectinosPerPoint &&
				n2.connection.length < this.settings.maxConnectinosPerPoint) {
				var connectedMapLine = n1.connectPointTo(n2);
				this.constructMapLineArrayBuffer(connectedMapLine);
			}
		}
	}

	// enable WebGL 32 bit index buffer or get an error
	if (!renderer.getContext().getExtension("OES_element_index_uint")) {
		console.error("32bit index buffer not supported!");
	}


	var mapLineIndices = new Uint32Array(this.mapLineIndices);
	var mapLinePositions = new Float32Array(this.mapLinePositions);
	var mapLineOpacities = new Float32Array(this.mapLineAttributes.opacity.value);

	this.mapLineGeom.addAttribute('index', new THREE.BufferAttribute(mapLineIndices, 1));
	this.mapLineGeom.addAttribute('position', new THREE.BufferAttribute(mapLinePositions, 3));
	this.mapLineGeom.addAttribute('opacity', new THREE.BufferAttribute(mapLineOpacities, 1));
	this.mapLineGeom.computeBoundingSphere();

	this.mapLineShaderMaterial = new THREE.ShaderMaterial({
		uniforms: this.mapLineUniforms,
		attributes: this.mapLineAttributes,
		vertexShader: null,
		fragmentShader: null,
		blending: currentBlendingMode,
		depthTest: false,
		transparent: true
	});

	this.mapLineMesh = new THREE.Line(this.mapLineGeom, this.mapLineShaderMaterial, THREE.LinePieces);
	this.meshComponents.add(this.mapLineMesh);

};

MapNetwork.prototype.initTraffic = function () {

	this.trafficLabels = [];
	this.trafficLabelRoot = new THREE.Object3D();
	this.meshComponents.add(this.trafficLabelRoot);

	for (var i = 0; i < TrafficData.length; i++) {
		var posx = TrafficData[i].position.x - 131.5;
		var posy = TrafficData[i].height;
		var posz = TrafficData[i].position.y - 70;
		var n = new Traffic(posx, posy, posz, TrafficData[i].size, TrafficData[i].color, TrafficData[i].label);
		this.components.traffics.push(n);
		this.trafficGeom.vertices.push(n);

		//Comment
		var comp = new THREE.Object3D();
		comp.position.set(posx, posy, posz);
		this.trafficLabelRoot.add(comp);
		var label = new CommentLabel(TrafficData[i].label, comp);
		this.trafficLabels.push(label);
	}


	// set mappoint attributes value
	for (var i = 0; i < this.components.traffics.length; i++) {
		this.trafficAttributes.color.value[i] = new THREE.Color(TrafficData[i].color); // initial mappoint color
		this.trafficAttributes.size.value[i] = TrafficData[i].size; // initial mappoint size
	}


	// mappoint mesh
	this.trafficParticles = new THREE.PointCloud(this.trafficGeom, this.trafficShaderMaterial);
	this.meshComponents.add(this.trafficParticles);

	this.trafficShaderMaterial.needsUpdate = true;

};

MapNetwork.prototype.initFirework = function () {
	this.fireworkRoot = new THREE.Object3D();
	this.meshComponents.add(this.fireworkRoot);

	for (var i = 0; i < FireworkData.length; i++) {
		var posx = FireworkData[i].position.x - 131.5;
		var posy = FireworkData[i].height;
		var posz = FireworkData[i].position.y - 70;
		var pos = new THREE.Vector3(posx, posy, posz);

		var fw = new Firework(this.fireworkRoot, pos, FireworkData[i].size, FireworkData[i].color, FireworkData[i].duration, FireworkData[i].label);
		this.fireworks.push(fw);

	}
}

MapNetwork.prototype.update = function (deltaTime) {

	if (!this.initialized) return;

	// update position of traffic labels
	for (var ii = 0; ii < this.trafficLabels.length; ii++) {
		this.trafficLabels[ii].updatePosition();
	}

	// update fireworks 
	for (var i = 0; i < this.fireworks.length; i++) {
		this.fireworks[i].update(deltaTime);
	}
};

MapNetwork.prototype.constructMapLineArrayBuffer = function (mapLine) {
	this.components.mapLines.push(mapLine);
	var vertices = mapLine.vertices;

	for (var i = 0; i < vertices.length; i++) {

		this.mapLinePositions.push(vertices[i].x, vertices[i].y, vertices[i].z);

		if (i < vertices.length - 1) {
			var idx = this.mapLineNextPositionsIndex;
			this.mapLineIndices.push(idx, idx + 1);

			var opacity = THREE.Math.randFloat(0.005, 0.2);
			this.mapLineAttributes.opacity.value.push(opacity, opacity);

		}

		this.mapLineNextPositionsIndex += 1;
	}
};

MapNetwork.prototype.releaseSignalAt = function () {

};

// Assets & Loaders --------------------------------------------------------

var loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = function () {

	document.getElementById( 'loading' ).style.display = 'none'; // hide loading animation when finished
	console.log( 'Done.' );

	main();

};


loadingManager.onProgress = function ( item, loaded, total ) {

	// console.log( loaded + '/' + total, item );

};


var shaderLoader = new THREE.XHRLoader( loadingManager );
shaderLoader.setResponseType( 'text' );

shaderLoader.loadMultiple = function ( SHADER_CONTAINER, urlObj ) {

	_.each( urlObj, function ( value, key ) {

		shaderLoader.load( value, function ( shader ) {

			SHADER_CONTAINER[ key ] = shader;

		} );

	} );

};

var SHADER_CONTAINER = {};
shaderLoader.loadMultiple( SHADER_CONTAINER, {

	mappointVert: 'shaders/mappoint.vert',
	mappointFrag: 'shaders/mappoint.frag',

	maplineVert: 'shaders/mapline.vert',
	maplineFrag: 'shaders/mapline.frag',

	fireworkVert: 'shaders/firework.vert',
	fireworkFrag: 'shaders/firework.frag',

} );



var OBJ_MODELS = {};
var OBJloader = new THREE.OBJLoader( loadingManager );
OBJloader.load( 'models/map_vertex.obj', function ( model ) {

	OBJ_MODELS.usmap = model.children[ 0 ];

} );


var TEXTURES = {};
var textureLoader = new THREE.TextureLoader( loadingManager );
textureLoader.load( 'sprites/circle.png', function ( tex ) {

	TEXTURES.circle = tex;
	
} );

textureLoader.load( 'sprites/mark.png', function ( tex ) {

	TEXTURES.mark = tex;

} );

textureLoader.load( 'sprites/spark4.png', function ( tex ) {

	TEXTURES.spark4 = tex;

} );

textureLoader.load( 'sprites/spark5.png', function ( tex ) {

	TEXTURES.spark5 = tex;

} );

// Scene --------------------------------------------------------
/* exported updateHelpers */

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
}

var container, stats;
var scene, light, camera, cameraCtrl, renderer;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var pixelRatio = window.devicePixelRatio || 1;
var screenRatio = WIDTH / HEIGHT;
var clock = new THREE.Clock();
var FRAME_COUNT = 0;

// ---- Settings
var sceneSettings = {

	pause: false,
	bgColor: 0x111111,
	enableGridHelper: true,
	enableAxisHelper: false

};

// ---- Scene
container = document.getElementById('canvas-container');
scene = new THREE.Scene();

// ---- Renderer
renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(pixelRatio);

//Blending mode
var currentBlendingMode = THREE.NormalBlending;


renderer.setClearColor(sceneSettings.bgColor, 1);
renderer.autoClear = false;
container.appendChild(renderer.domElement);

// ---- Stats
stats = new Stats();
// container.appendChild(stats.domElement);

// ---- Camera
camera = new THREE.PerspectiveCamera(75, screenRatio, 0.1, 1000);
// camera orbit control
cameraCtrl = new THREE.OrbitControls(camera, renderer.domElement);
cameraCtrl.object.position.y = 120;
cameraCtrl.autoRotate = false;
cameraCtrl.autoRotateSpeed = 1;
cameraCtrl.enablePan = false;
cameraCtrl.enableRotate = false;



// ---- grid & axis helper
var gridHelper = new THREE.GridHelper(131.5, 5);
gridHelper.setColors(0x00bbff, 0xffffff);
gridHelper.material.opacity = 0.05;
gridHelper.material.transparent = true;
scene.add(gridHelper);

var axisHelper = new THREE.AxisHelper(50);
scene.add(axisHelper);

function updateHelpers() {
	axisHelper.visible = sceneSettings.enableAxisHelper;
	gridHelper.visible = sceneSettings.enableGridHelper;
}



/*
// ---- Lights
// back light
light = new THREE.DirectionalLight( 0xffffff, 0.8 );
light.position.set( 100, 230, -100 );
scene.add( light );

// hemi
light = new THREE.HemisphereLight( 0x00ffff, 0x29295e, 1 );
light.position.set( 370, 200, 20 );
scene.add( light );

// ambient
light = new THREE.AmbientLight( 0x111111 );
scene.add( light );
*/

// Main --------------------------------------------------------
/* exported main */

function main() {

	var mapNet = window.mapNet = new MapNetwork();
	scene.add(mapNet.meshComponents);

	var geometry = new THREE.PlaneGeometry(180, 180, 1);
	var material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: TEXTURES.mark, combine: currentBlendingMode, transparent: true, opacity: 0.1 });
	var marker = new THREE.Mesh(geometry, material);
	marker.rotation.set(-Math.PI / 2, 0, 0);
	marker.position.set(0, -80, 0);
	scene.add(marker);

	run();
}



// Run --------------------------------------------------------

function update() {

	updateHelpers();

	if (!sceneSettings.pause) {

		var deltaTime = clock.getDelta();
		mapNet.update(deltaTime);
		cameraCtrl.update();
	}

}

// ----  draw loop
function run() {

	requestAnimationFrame(run);
	
	renderer.clear();
	update();
	renderer.render(scene, camera);
	stats.update();
	FRAME_COUNT++;

}

// Events --------------------------------------------------------

window.addEventListener( 'keypress', function ( event ) {

	var key = event.keyCode;

	switch ( key ) {

		case 32:/*space bar*/ sceneSettings.pause = !sceneSettings.pause;
			break;

		case 65:/*A*/
		case 97:/*a*/ sceneSettings.enableGridHelper = !sceneSettings.enableGridHelper;
			break;

		case 83 :/*S*/
		case 115:/*s*/ sceneSettings.enableAxisHelper = !sceneSettings.enableAxisHelper;
			break;

	}

} );


$( function () {
	var timerID;
	$( window ).resize( function () {
		clearTimeout( timerID );
		timerID = setTimeout( function () {
			onWindowResize();
		}, 250 );
	} );
} );


function onWindowResize() {

	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	pixelRatio = window.devicePixelRatio || 1;
	screenRatio = WIDTH / HEIGHT;

	camera.aspect = screenRatio;
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setPixelRatio( pixelRatio );

}

//Real signal's data
var TrafficData = [
    { size: 1.5, position: { x: 100, y: 20 }, height: 0, color: '#ffff00', label: 'A city' },
    { size: 1, position: { x: 50, y: 50 }, height: 0, color: '#ff0000', label: 'B city' },
    { size: 1, position: { x: 80, y: 100 }, height: 0, color: '#ff00ff', label: 'C city' },
];

var FireworkData = [
    { size: 1, position: { x: 100, y: 20 }, height: 0, duration: 6, color: '#ff00ff', label: 'A firework' },
    { size: 1.5, position: { x: 50, y: 50 }, height: 0, duration: 5, color: '#ffff00', label: 'B firework' },
    { size: 2, position: { x: 80, y: 100 }, height: 0, duration: 4, color: '#00ffff', label: 'C firework' },
];