import {
	Engine,
	Scene,
	HemisphericLight,
	Vector3,
	FreeCamera,
	ShadowGenerator,
	PhysicsImpostor,
	CannonJSPlugin,
	Mesh,
	Color3,
	Sound
} from 'babylonjs';
import CANNON from 'cannon';
import Ball from './Ball';

class GameScene {

	constructor(canvas){
		window.CANNON = CANNON;
		const engine = new Engine(canvas);
		this._scene = new Scene(engine);
		this._canvas = canvas;
		this.ground = Mesh.CreateGround("ground1", 10, 30, 2, this._scene);
		this._scene.clearColor = new Color3(255, 255, 255);
		this.addPhysics();
		this.addLoadingTasks();
		this.addLights();
		this.addCamera();
		this.addBall();
		//this.loadSounds();
		console.log('game beginning');
		engine.runRenderLoop(() => {
			this._scene.render();
		});
	}

	addLoadingTasks(){
		// Todo: implement loading
	}

	addLights(){
		const light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);
		light.intensity = 0.5;
	}

	addCamera(){
		const camera = new FreeCamera("FreeCamera",new Vector3(0, 2, 10), this._scene);
		camera.setTarget(new Vector3(0, 5, -10));
		camera.attachControl(this._canvas, false);
		camera.setTarget(Vector3.Zero());
	}

	addPhysics(){
		this._scene.workerCollisions = true;
		this._scene.enablePhysics();
		this._scene.enablePhysics();
		this._scene.collisionsEnabled = true;
	}

	loadSounds(){
		const bounce = new Sound("sound_name", "/bounce.wav", this._scene, () => {});
		const lost = new Sound("sound_nalost_soundme", "/lost.wav", this._scene, () => {});
	}

	addBall(){
		this._ball = new Ball(this._scene);
	}

}

export default GameScene;