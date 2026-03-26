<script lang="ts">
	import { T } from '@threlte/core';
	import { HTML } from '@threlte/extras';

	interface Props {
		position: [number, number, number];
		count: number;
	}

	const { position, count }: Props = $props();
</script>

<T.Group position.x={position[0]} position.y={position[1]} position.z={position[2]}>
	<HTML center sprite pointerEvents="none">
		<span class="overlap-badge">&times;{count}</span>
	</HTML>
</T.Group>

<style>
	.overlap-badge {
		display: inline-block;
		padding: 1px 6px;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #0f172a;
		background-color: #f59e0b;
		border-radius: 9999px;
		pointer-events: none;
		white-space: nowrap;
		transform: translateY(-14px);
	}
</style>
