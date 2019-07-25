// MapPoint ----------------------------------------------------------------

function MapPoint( idx, x, y, z ) {
	this.idx = idx;
	this.connection = [];
	this.fired = false;
	this.prevReleaseAxon = null;
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
		maxLineDist: 15,
		maxConnectinosPerPoint: 10,
	};

	this.meshComponents = new THREE.Object3D();

	// NN component containers
	this.components = {
		mapPoints: [],
		mapLines: []
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
	this.mapPointSizeMultiplier = 0.4;
	this.spriteTextureMapPoint = TEXTURES.circle;
	this.mapPointColor = '#ffffff';
	this.mapPointOpacity = 0.5;
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

	// initialize NN
	this.initNeuralNetwork();

}

MapNetwork.prototype.initNeuralNetwork = function () {

	this.initMapPoints(OBJ_MODELS.usmap.geometry.vertices);
	this.initMapLines();

	this.mapPointShaderMaterial.vertexShader = SHADER_CONTAINER.mappointVert;
	this.mapPointShaderMaterial.fragmentShader = SHADER_CONTAINER.mappointFrag;

	this.mapLineShaderMaterial.vertexShader = SHADER_CONTAINER.maplineVert;
	this.mapLineShaderMaterial.fragmentShader = SHADER_CONTAINER.maplineFrag;

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


MapNetwork.prototype.update = function (deltaTime) {

	if (!this.initialized) return;


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
	bgColor: 0x020220,
	enableGridHelper: false,
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
// camera.position.set(0, 150, 0);
// camera orbit control
cameraCtrl = new THREE.OrbitControls(camera, renderer.domElement);
cameraCtrl.object.position.z = 100;
cameraCtrl.object.position.x = 100;
cameraCtrl.autoRotate = false;
cameraCtrl.autoRotateSpeed = 1;
cameraCtrl.enablePan = false;
cameraCtrl.enableRotate = false;



// ---- grid & axis helper
var gridHelper = new THREE.GridHelper(100, 5);
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
var DATASET = [
]