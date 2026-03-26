<script lang="ts">
	import { T } from '@threlte/core';
	import * as THREE from 'three';

	const GRID_COLOR = 0x334155;
	const GRID_OPACITY = 0.4;
	const MIN = 1;
	const MAX = 10;

	function createGridGeometry(): THREE.BufferGeometry {
		const points: number[] = [];

		// Bottom plane (y = 0): lines along X and Z
		for (let i = MIN; i <= MAX; i++) {
			// Lines along X at y=0
			points.push(MIN, 0, i, MAX, 0, i);
			// Lines along Z at y=0
			points.push(i, 0, MIN, i, 0, MAX);
		}

		// Back plane (z = MAX): lines along X and Y
		for (let i = MIN; i <= MAX; i++) {
			// Lines along X at z=MAX
			points.push(MIN, i, MAX, MAX, i, MAX);
			// Lines along Y at z=MAX
			points.push(i, MIN, MAX, i, MAX, MAX);
		}

		// Left plane (x = MIN): lines along Y and Z
		for (let i = MIN; i <= MAX; i++) {
			// Lines along Z at x=MIN
			points.push(MIN, i, MIN, MIN, i, MAX);
			// Lines along Y at x=MIN
			points.push(MIN, MIN, i, MIN, MAX, i);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
		return geometry;
	}

	const gridGeometry = createGridGeometry();
	const gridMaterial = new THREE.LineBasicMaterial({
		color: GRID_COLOR,
		transparent: true,
		opacity: GRID_OPACITY
	});
</script>

<T.LineSegments geometry={gridGeometry} material={gridMaterial} />
