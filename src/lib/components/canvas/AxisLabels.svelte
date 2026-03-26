<script lang="ts">
	import { T } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import { preferences } from '$lib/stores/preferences';
	import type { LensMode } from '$lib/types/preferences';

	const LABEL_COLOR = '#F8FAFC';
	const LABEL_SIZE = 0.35;
	const NUMBER_SIZE = 0.25;
	const MIN = 1;
	const MAX = 10;

	const lensLabels: Record<LensMode, string> = {
		staleness: 'Staleness \u2192',
		fun: 'Fun \u2192',
		friction: 'Friction \u2192'
	};

	let activeLens: LensMode = $state('staleness');

	preferences.subscribe((p) => {
		activeLens = p.activeLens;
	});

	const numbers = Array.from({ length: MAX - MIN + 1 }, (_, i) => i + MIN);
</script>

<!-- Axis title labels -->
<Text
	text="Importance \u2192"
	fontSize={LABEL_SIZE}
	color={LABEL_COLOR}
	anchorX="center"
	anchorY="middle"
	position={[5.5, -0.8, 0]}
	rotation={[-Math.PI / 2, 0, 0]}
/>

<Text
	text="Urgency \u2192"
	fontSize={LABEL_SIZE}
	color={LABEL_COLOR}
	anchorX="center"
	anchorY="middle"
	position={[-0.3, 5.5, 0]}
	rotation={[0, 0, Math.PI / 2]}
/>

<Text
	text={lensLabels[activeLens]}
	fontSize={LABEL_SIZE}
	color={LABEL_COLOR}
	anchorX="center"
	anchorY="middle"
	position={[0, -0.8, 5.5]}
	rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
/>

<!-- Numeric labels along X-axis (Importance) -->
{#each numbers as n}
	<Text
		text={String(n)}
		fontSize={NUMBER_SIZE}
		color={LABEL_COLOR}
		anchorX="center"
		anchorY="middle"
		position={[n, -0.4, 0]}
		rotation={[-Math.PI / 2, 0, 0]}
	/>
{/each}

<!-- Numeric labels along Y-axis (Urgency) -->
{#each numbers as n}
	<Text
		text={String(n)}
		fontSize={NUMBER_SIZE}
		color={LABEL_COLOR}
		anchorX="center"
		anchorY="middle"
		position={[0.4, n, 0]}
		rotation={[0, 0, 0]}
	/>
{/each}

<!-- Numeric labels along Z-axis (dynamic lens) -->
{#each numbers as n}
	<Text
		text={String(n)}
		fontSize={NUMBER_SIZE}
		color={LABEL_COLOR}
		anchorX="center"
		anchorY="middle"
		position={[0, -0.4, n]}
		rotation={[-Math.PI / 2, 0, 0]}
	/>
{/each}
