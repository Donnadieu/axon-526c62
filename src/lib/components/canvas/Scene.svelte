<script lang="ts">
	import { T } from '@threlte/core';
	import { useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import { orbitControlsRef, cameraRef } from '$lib/stores/camera';
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
</script>

<T.PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} bind:ref={camRef}>
	<OrbitControls
		bind:ref={orbitRef}
		target={[5.5, 5.5, 5]}
		enableDamping
		dampingFactor={0.1}
		minDistance={5}
		maxDistance={40}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[10, 20, 10]} intensity={0.8} />
