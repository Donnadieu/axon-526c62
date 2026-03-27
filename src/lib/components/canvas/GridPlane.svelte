<script lang="ts">
	import { T } from '@threlte/core';
	import type { IntersectionEvent } from '@threlte/extras';
	import { clamp, todayYYMMDD } from '$lib/utils/staleness';
	import { generateId } from '$lib/utils/id';
	import { addTask, selectedTaskId } from '$lib/stores/tasks';

	function handleClick(e: IntersectionEvent<MouseEvent>) {
		e.stopPropagation();
		e.nativeEvent.stopPropagation();

		const point = e.point;
		const importance = clamp(Math.round(point.x), 1, 10);
		const urgency = clamp(Math.round(point.y), 1, 10);

		const id = generateId();
		addTask({
			id,
			text: '',
			importance,
			urgency,
			created: todayYYMMDD(),
			status: 'open'
		});

		selectedTaskId.set(id);
	}
</script>

<T.Mesh position.x={5.5} position.y={5.5} position.z={0} onclick={handleClick}>
	<T.PlaneGeometry args={[10, 10]} />
	<T.MeshBasicMaterial transparent opacity={0} />
</T.Mesh>
