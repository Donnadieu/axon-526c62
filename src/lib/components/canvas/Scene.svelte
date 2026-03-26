<script lang="ts">
	import { T } from '@threlte/core';
	import { useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import {
		orbitControlsRef,
		cameraRef,
		cameraState,
		animateCameraTo,
		DEFAULT_3D_POSITION,
		DEFAULT_3D_TARGET,
		FLAT_2D_POSITION,
		FLAT_2D_TARGET
	} from '$lib/stores/camera';
	import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { PerspectiveCamera } from 'three';

	const { scene } = useThrelte();
	scene.background = new THREE.Color('#0F172A');

	interactivity();

	let orbitRef = $state<ThreeOrbitControls | undefined>(undefined);
	let camRef = $state<PerspectiveCamera | undefined>(undefined);

	$effect(() => {
		orbitControlsRef.set(orbitRef);
	});

	$effect(() => {
		cameraRef.set(camRef);
	});

	const is2D = $derived($cameraState.is2D);

	let prevIs2D = $state(false);

	$effect(() => {
		if (is2D === prevIs2D) return;
		prevIs2D = is2D;

		if (!orbitRef) return;

		if (is2D) {
			animateCameraTo(FLAT_2D_POSITION, FLAT_2D_TARGET);
			// Disable rotation but keep zoom and pan
			orbitRef.enableRotate = false;
		} else {
			animateCameraTo(DEFAULT_3D_POSITION, DEFAULT_3D_TARGET);
			orbitRef.enableRotate = true;
		}
	});
</script>

<T.PerspectiveCamera makeDefault position={DEFAULT_3D_POSITION} fov={50} bind:ref={camRef}>
	<OrbitControls
		bind:ref={orbitRef}
		target={DEFAULT_3D_TARGET}
		enableDamping
		dampingFactor={0.1}
		minDistance={5}
		maxDistance={40}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[10, 20, 10]} intensity={0.8} />
