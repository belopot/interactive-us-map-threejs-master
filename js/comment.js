function CommentLabel(label, targetObj) {
  this.div = document.createElement('div');
  this.div.style.position = 'absolute';
  this.div.innerHTML = label;
  this.div.style.top = -1000;
  this.div.style.left = -1000;
  this.div.style.color = '#aaaaaa';
  this.div.style.fontSize = '14px';
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
  this.div.style.top = coords2d.y - this.div.offsetHeight + 30 + 'px';
}

CommentLabel.prototype.get2DCoords = function () {
  var vector = this.position.project(camera);
  vector.x = (vector.x + 1) / 2 * window.innerWidth;
  vector.y = -(vector.y - 1) / 2 * window.innerHeight;
  return vector;
}