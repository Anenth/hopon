import {
	Plane,
	Engine,
	Scene,
	HemisphericLight,
	Vector3,
	Color3,
	FreeCamera,
	ArcRotateCamera,
	Mesh,
	MeshBuilder,
	PhysicsImpostor,
	CannonJSPlugin,
	Texture,
	StandardMaterial,
	ShadowGenerator,
	DirectionalLight,
	Color4,
	CSG,
	Animation,
	AnimationEvent,
	Sound
} from 'babylonjs';

import CANNON from 'cannon';
window.CANNON = CANNON;

const canvas = document.getElementById("stage");
const engine = new Engine(canvas);
const scene = new Scene(engine);
const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
let started = false;
let renderScene = true;
light.intensity = 1;
const camera = new FreeCamera("FreeCamera",new Vector3(0, 4, -22), scene);
camera.setTarget(new Vector3(0, 1, 0));
const sphere = MeshBuilder.CreateSphere("ball", {
	diameter: 0.6
}, scene);
sphere.position.z = -16;
sphere.position.y = 0.7;
const boxes=[];

let sceneAnimations = [];
let currentBox;
// droping animation
const droppingKeys = [];
droppingKeys.push({
	frame: 0,
	value: 3
});
droppingKeys.push({
	frame: 20,
	value: 0
});

// opacity animation
const opacityKeys = [];
opacityKeys.push({
	frame: 0,
	value: 0
});
opacityKeys.push({
	frame: 20,
	value: 1
});


// jump animation
const jumpKeys = [];
let nextBox = 1;
jumpKeys.push({
	frame: 0,
	value: 0.7
});
jumpKeys.push({
	frame: 15,
	value: 2
});
jumpKeys.push({
	frame: 30,
	value: 0.5
});
jumpKeys.push({
	frame: 32,
	value: 0.5
});
jumpKeys.push({
	frame: 100,
	value: -10
});
scene.enablePhysics();
sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, { mass: 0, restitution:0 }, scene);
const bounce = new Sound("sound_name", "/bounce.wav", scene, () => {});
const lost = new Sound("sound_nalost_soundme", "/lost.wav", scene, () => {});
const lostEvent= new AnimationEvent(36, function() { lost.play()  }, false);
const xPositions = [-3.5, -2.5, 0, 2.5, 3.5];
let startPosition = -16;
let jumpAnimationRef;
//box
for(let i=0; i<10; i++){
	const box = MeshBuilder.CreateBox('box1', {
		size: 2,
		height:0.4,
		faceColors: new Color4(0,0,1,0.8),
	},scene);
	const boxMaterial = new StandardMaterial('boxMaterial', scene);
	boxes.push(box);
	box.checkCollisions = true;
	box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
	box.material = boxMaterial;
	boxMaterial.diffuseColor = new Color3(0.301, 0.815, 1);
	boxMaterial.ambientColor = new Color3(0.101, 0.715, 1);
	const newXPosition = xPositions[Math.floor(Math.random() * 4)];
	if (i > 0) {
		box.position.x = newXPosition;
	}

	box.position.z = startPosition;
	box.material.aplha = 0;
	box.startPosition = startPosition;
	startPosition += 8;
	const droppingAnimation = new Animation("droppingAnimation", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
	const opacityAnimation = new Animation("opacityAnimation", "material.alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
	droppingAnimation.setKeys(Object.assign([],droppingKeys));
	opacityAnimation.setKeys(Object.assign([],opacityKeys));
	box.animations.push(droppingAnimation);
	box.animations.push(opacityAnimation);
	box.physicsImpostor = new PhysicsImpostor(box, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);
	setTimeout(()=>{
		box.appearAnimation = scene.beginAnimation(box, 0, 20, false);
	}, i* 25);
}


// setup
scene.clearColor = new Color3(255,255,255);
scene.gravity = new Vector3(0, 0, 0);

//ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0 }, scene);


scene.collisionsEnabled = true;
sphere.checkCollisions = true;
const materialSphere1 = new StandardMaterial("texture1", scene);
materialSphere1.diffuseTexture = new Texture("ball.png", scene);
sphere.material = materialSphere1;
scene.registerBeforeRender(function () {
	camera.position.z = sphere.position.z - 12;
	if(started){
		sphere.rotation.x += 0.1;
		sphere.rotation.y += 0.1;
	}
	if (currentBox && sphere.intersectsMesh(currentBox, false)) {
		jumpAnimationRef.pause();
		sphere.position.y =0.7;
		const jumpAnimation = new Animation("jumpAnimation", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const movingAnimation = new Animation("movingAnimation", "position.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
		jumpAnimation.setKeys(jumpKeys);
		currentBox = getNextIntersectingBox();
		const nextZPosition = currentBox.position.z;
		movingAnimation.setKeys(getMovementKeys(sphere.position.z, nextZPosition));
		sphere.animations.push(jumpAnimation);
		sphere.animations.push(movingAnimation);
		jumpAnimationRef = scene.beginAnimation(sphere, 0, 70, false);
		jumpAnimation.addEvent(lostEvent);
		bounce.play();
		((box)=>{
			setTimeout(()=>{
				moveBox(box);
			}, 1500);
		})(currentBox)
	}
});
engine.runRenderLoop(function () {
	scene.render();
});

let ref;
document.addEventListener('touchstart', e=> {
	ref = e.touches[0].clientX
	init();
});
document.addEventListener('touchmove', e=> {
	if(ref) {
		const shift = (e.touches[0].clientX - ref)/50;
		requestAnimationFrame(()=>{
			sphere.position.x = shift;
		})
	}
})

document.addEventListener('click', ()=>{
	init();
});

function init() {
	if (!started) {
		started = true;
		const jumpAnimation = new Animation("jumpAnimation", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
		const movingAnimation = new Animation("movingAnimation", "position.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
		jumpAnimation.setKeys(jumpKeys);
		currentBox = getNextIntersectingBox();
		const nextZPosition = currentBox.position.z;
		movingAnimation.setKeys(getMovementKeys(sphere.position.z, nextZPosition));
		sphere.animations.push(jumpAnimation);
		sphere.animations.push(movingAnimation);

		jumpAnimationRef = scene.beginAnimation(sphere, 0, 70, true);
		jumpAnimation.addEvent(lostEvent);

		((firstbox)=>{
			setTimeout(()=>{
				moveBox(firstbox);
			}, 1000);
		})(boxes[0]);

		((box)=>{
			setTimeout(()=>{
				moveBox(box);
			}, 1500);
		})(currentBox);

	}
}

function getMovementKeys (currentPoint, destination) {
	//animation keys
	const movementKeys = [];
	movementKeys.push({
		frame: 0,
		value: currentPoint
	});
	movementKeys.push({
		frame: 35,
		value: destination
	});

	return movementKeys;
}

function getNextIntersectingBox(){
	const nextBoxObj =  boxes[nextBox];

	if(nextBox <  9) {
		nextBox++;
	} else {
		nextBox = 0;
	}
	return nextBoxObj;
}

function moveBox(box){
	const newXPosition = xPositions[Math.floor(Math.random() * 4)];
	box.position.x = newXPosition;
	box.position.z = startPosition;
	startPosition += 8;
	box.appearAnimation.restart();
}