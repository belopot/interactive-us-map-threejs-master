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
