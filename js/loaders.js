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
