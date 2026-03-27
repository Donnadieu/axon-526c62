<script lang="ts">
	interface Props {
		message: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	const { message, onConfirm, onCancel }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onCancel();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" tabindex="-1">
	<div class="card variant-filled-surface-700 modal-card">
		<header class="card-header">
			<h3 class="h3">Confirm</h3>
		</header>
		<section class="p-4">
			<p>{message}</p>
		</section>
		<footer class="card-footer flex justify-end gap-2 p-4">
			<button type="button" class="btn variant-ghost" onclick={onCancel}>Cancel</button>
			<button type="button" class="btn variant-filled-error" onclick={onConfirm}>Confirm</button>
		</footer>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.6);
	}

	.modal-card {
		width: 100%;
		max-width: 400px;
		border-radius: 8px;
		background-color: var(--axon-secondary);
		border: 1px solid var(--axon-muted);
	}
</style>
