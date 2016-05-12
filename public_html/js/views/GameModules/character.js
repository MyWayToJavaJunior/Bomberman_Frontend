define(function (require) {
    var THREE = require('three');
    var gameObjects = require('views/GameModules/gameObjects');
    var world = require('views/GameModules/worldBuilder');
    var jQuery = require('jquery');
    var ws = require('utils/ws');

    var Character = {
        init: function (color, position) {
            var head = new THREE.SphereGeometry(24, 16, 16),
                hand = new THREE.SphereGeometry(8, 8, 8),
                foot = new THREE.SphereGeometry(16, 4, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                nose = new THREE.SphereGeometry(4, 8, 8),
                material = new THREE.MeshLambertMaterial(color);

            this.mesh = new THREE.Object3D();
            this.mesh.position.y = 48;
            this.head = new THREE.Mesh(head, material);
            this.head.position.y = 0;
            this.mesh.add(this.head);
            this.hands = {
                left: new THREE.Mesh(hand, material),
                right: new THREE.Mesh(hand, material)
            };
            this.hands.left.position.x = -32;
            this.hands.left.position.y = -8;
            this.hands.right.position.x = 32;
            this.hands.right.position.y = -8;
            this.mesh.add(this.hands.left);
            this.mesh.add(this.hands.right);
            this.feet = {
                left: new THREE.Mesh(foot, material),
                right: new THREE.Mesh(foot, material)
            };
            this.feet.left.position.x = -20;
            this.feet.left.position.y = -36;
            this.feet.left.rotation.y = Math.PI / 4;
            this.feet.right.position.x = 20;
            this.feet.right.position.y = -36;
            this.feet.right.rotation.y = Math.PI / 4;
            this.mesh.add(this.feet.left);
            this.mesh.add(this.feet.right);
            this.nose = new THREE.Mesh(nose, material);
            this.nose.position.y = 0;
            this.nose.position.z = 24;
            this.mesh.add(this.nose);

            var playerCoordinates = gameObjects.getRealCoordinates(position.x, position.z); // where we need to place our character
            this.mesh.position.set(playerCoordinates.x, 48, playerCoordinates.z);


            this.direction = new THREE.Vector3(0, 0, 0);
            this.step = 0;
            this.rays = [
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(1, 0, 1),
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(1, 0, -1),
                new THREE.Vector3(0, 0, -1),
                new THREE.Vector3(-1, 0, -1),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(-1, 0, 1)
            ];
            this.caster = new THREE.Raycaster();

            this.setDirection = function (controls) {
                var x = controls.left ? 1 : controls.right ? -1 : 0;
                var y = 0;
                var z = controls.up ? 1 : controls.down ? -1 : 0;
                this.direction.set(x, y, z);
            };

            this.motion = function () {
                this.collision();
                if (this.direction.x !== 0 || this.direction.z !== 0) {
                    this.rotate();
                    this.move();
                    return true;
                }
            };

            this.collision = function () {
                var collisions;
                var i;
                // Maximum distance from the origin before we consider collision
                var distance = 28;
                // Get the obstacles array from our world
                var obstacles = world.getObstacles();

                for (i = 0; i < this.rays.length; i += 1) {
                    this.caster.set(this.mesh.position, this.rays[i]);
                    collisions = this.caster.intersectObjects(obstacles, true);
                    if (collisions.length > 0 && collisions[0].distance <= distance) {
                        if ((i === 0 || i === 1 || i === 7) && this.direction.z === 1) {
                            this.direction.setZ(0);
                        } else if ((i === 3 || i === 4 || i === 5) && this.direction.z === -1) {
                            this.direction.setZ(0);
                        }
                        if ((i === 1 || i === 2 || i === 3) && this.direction.x === 1) {
                            this.direction.setX(0);
                        } else if ((i === 5 || i === 6 || i === 7) && this.direction.x === -1) {
                            this.direction.setX(0);
                        }
                    }
                }
            };

            this.rotate = function () {
                var angle = Math.atan2(this.direction.x, this.direction.z);
                var difference = angle - this.mesh.rotation.y;
                // If we're doing more than a 180°
                if (Math.abs(difference) > Math.PI) {
                    // We proceed to a direct 360° rotation in the opposite way
                    if (difference > 0) {
                        this.mesh.rotation.y += 2 * Math.PI;
                    } else {
                        this.mesh.rotation.y -= 2 * Math.PI;
                    }
                    difference = angle - this.mesh.rotation.y;
                }
                if (difference !== 0) {
                    this.mesh.rotation.y += difference / 4;
                }
                // this.mesh.rotation.y = angle; // if we dont want to animate rotation
            };

            this.move = function () {
                this.mesh.position.x += this.direction.x * ((this.direction.z === 0) ? 4 : Math.sqrt(8));
                this.mesh.position.z += this.direction.z * ((this.direction.x === 0) ? 4 : Math.sqrt(8));
                this.step += 1 / 4;
                this.feet.left.position.setZ(Math.sin(this.step) * 16);
                this.feet.right.position.setZ(Math.cos(this.step + (Math.PI / 2)) * 16);
                this.hands.left.position.setZ(Math.cos(this.step + (Math.PI / 2)) * 8);
                this.hands.right.position.setZ(Math.sin(this.step) * 8);
            };
            this.setControls = function (position) {
                var controls = {
                    left: false,
                    up: false,
                    right: false,
                    down: false
                };
                function makeControls(status, keyCode, position) {
                    var pressed = status;
                    if (position === 'top') {
                        switch (String.fromCharCode(keyCode)) {
                            case 'A':
                                controls.right = pressed;
                                break;
                            case 'W':
                                controls.down = pressed;
                                break;
                            case 'D':
                                controls.left = pressed;
                                break;
                            case 'S':
                                controls.up = pressed;
                                break;
                        }
                    } else {
                        switch (String.fromCharCode(keyCode)) {
                            case 'A':
                                controls.left = pressed;
                                break;
                            case 'W':
                                controls.up = pressed;
                                break;
                            case 'D':
                                controls.right = pressed;
                                break;
                            case 'S':
                                controls.down = pressed;
                                break;
                        }
                    }
                    gameObjects.firstCharacter.setDirection(controls);
                }
                var gameDiv = jQuery('#game');
                gameDiv.attr("contentEditable", "true");
                gameDiv[0].contentEditable = true;
                gameDiv.keydown(function (e) {
                    if (String.fromCharCode(e.keyCode ) == ' '){
                        gameObjects.setBomb(123);
                    }
                    makeControls(true, e.keyCode, position);
                    e.preventDefault();
                });
                gameDiv.keyup(function (e) {
                    makeControls(false, e.keyCode, position);
                    e.preventDefault();
                });
                gameDiv.focus();
            };
            this.setFocus = function (object, z) {
                gameObjects.camera.position.set(object.position.x, object.position.y + 750, object.position.z - z);
                gameObjects.camera.lookAt(object.position);
            };
        }
    };
    return Character
});