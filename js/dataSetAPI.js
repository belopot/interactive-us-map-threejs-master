//Real signal's data
var TrafficData = [
    { size: 1.5, position: { x: 100, y: 20 }, height: 20, color: '#ff0000', label: 'A city' },
    { size: 1, position: { x: 130, y: 50 }, height: 17, color: '#ff0000', label: 'B city' },
    { size: 1, position: { x: 180, y: 100 }, height: 16, color: '#ff0000', label: 'C city' },
];

var FireworkData = [
    // { size: 0.5, position: { x: 100, y: 20 }, height: 20, duration: 6, color: '#ffff00', label: 'A firework' },
    // { size: 0.3, position: { x: 130, y: 50 }, height: 17, duration: 5, color: '#ff0000', label: 'B firework' },
    // { size: 0.4, position: { x: 180, y: 100 }, height: 16, duration: 4, color: '#ff00ff', label: 'C firework' },
];

// x =  [0 to 263], y = [0 to 140]
var fireworkColors = [
    0xff0000, 0xffff00, 0x00ffff, 0xff00ff, 0xefff00, 0xffdf00, 0xffffdf, 0xa4ff00, 0x145200, 0x753412, 0x753ff2, 0x1dbb88, 0xd3dd32, 0x752376, 0x7599cc, 0xaa34bb, 0x75ff12
]
for (var i = 0; i < 500; i++) {
    var fd = { size: 0.3, position: { x: THREE.Math.randInt(0, 263), y: THREE.Math.randInt(0, 140) }, height: 20, duration: THREE.Math.randFloat(0, 10), color: fireworkColors[THREE.Math.randInt(0, fireworkColors.length-1)], label: 'A firework' };
    FireworkData.push(fd);
}