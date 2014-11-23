var Vector = require('./vector');

// Checks if the radians are between 22.5 to -22.5 degrees
function isInMovementRange(angleInRadians) {
  return angleInRadians >= -0.392699082 && angleInRadians <= 0.392699082;
}

// Normalize hand coordinates to the shoulder and return the angle between them
//
// We do this by setting shoulder as the origin and then
// adjusting the hand vector to this origin.
function calculateNormalizedArmAngle(shoulder, hand) {
  var normalizedHand = hand.subtract(shoulder);
  var normalizedShoulder = new Vector(normalizedHand.x, 0, 0);
  return normalizedShoulder.angleTo(normalizedHand);
}


// Flips x-axis to be positive
function normalizedHand(x, y, z) {
  return new Vector(Math.abs(x), y, z);
}

function Body() {
  this.leftHand = null;
  this.leftShoulder = null;

  this.rightHand = null;
  this.rightShoulder = null;
}

Body.prototype.setLeftHand = function(x, y, z) {
  this.leftHand = normalizedHand(x, y, 0);
};

Body.prototype.setLeftShoulder = function(x, y, z) {
  this.leftShoulder = new Vector(x, y, 0);
};

Body.prototype.setRightHand = function(x, y, z) {
  this.rightHand = normalizedHand(x, y, 0);
};

Body.prototype.setRightShoulder = function(x, y, z) {
  this.rightShoulder = new Vector(x, y, 0);
};


Body.prototype.hasLeftHand = function() {
  return !!this.leftShoulder && !!this.leftHand;
}

Body.prototype.hasRightHand = function() {
  return !!this.rightShoulder && !!this.rightHand;
};


Body.prototype.isLeftHandActive = function() {
  if (!this.hasLeftHand()) {
    return false;
  }

  var angle = calculateNormalizedArmAngle(this.leftShoulder, this.leftHand);

  return isInMovementRange(angle);
};

Body.prototype.isRightHandActive = function() {
  if (!this.hasRightHand()) {
    return false;
  }

  var angle = calculateNormalizedArmAngle(this.rightShoulder, this.rightHand);

  return isInMovementRange(angle);
}

module.exports = Body;
