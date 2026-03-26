<script lang="ts">
	import { T } from '@threlte/core';
	import { useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import { OrbitControls } from '@threlte/extras';

	const { scene } = useThrelte();
	scene.background = new THREE.Color('#0F172A');
</script>

<T.PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50}>
	<OrbitControls target={[5.5, 5.5, 5]} enableDamping />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[10, 20, 10]} intensity={0.8} />
