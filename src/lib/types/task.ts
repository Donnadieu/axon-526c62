export interface Task {
	id: string;
	text: string;
	importance: number;
	urgency: number;
	created: string;
	status: 'open' | 'done';
	due?: string;
	fun?: number;
	friction?: number;
}
