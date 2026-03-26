import { join } from 'path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config: Config = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			colors: {
				primary: '#6D28D9',
				secondary: '#1E293B',
				accent: '#F59E0B',
				background: '#0F172A',
				foreground: '#F8FAFC',
				muted: '#334155',
				destructive: '#EF4444'
			},
			fontFamily: {
				heading: ['Space Grotesk', 'sans-serif'],
				body: ['Inter', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			}
		}
	},
	plugins: [
		skeleton({
			themes: {
				custom: [
					{
						name: 'axon-dark',
						properties: {
							'--theme-font-family-heading': 'Space Grotesk, sans-serif',
							'--theme-font-family-base': 'Inter, sans-serif',
							'--theme-rounded-base': '8px',
							'--theme-rounded-container': '8px',
							'--theme-border-base': '1px',
							'--color-primary-50': '237 233 254',
							'--color-primary-100': '221 214 254',
							'--color-primary-200': '196 181 253',
							'--color-primary-300': '167 139 250',
							'--color-primary-400': '139 92 246',
							'--color-primary-500': '109 40 217',
							'--color-primary-600': '91 33 182',
							'--color-primary-700': '76 29 149',
							'--color-primary-800': '64 25 126',
							'--color-primary-900': '46 16 101',
							'--color-surface-50': '248 250 252',
							'--color-surface-100': '241 245 249',
							'--color-surface-200': '226 232 240',
							'--color-surface-300': '148 163 184',
							'--color-surface-400': '100 116 139',
							'--color-surface-500': '51 65 85',
							'--color-surface-600': '30 41 59',
							'--color-surface-700': '15 23 42',
							'--color-surface-800': '15 23 42',
							'--color-surface-900': '2 6 23',
							'--color-tertiary-500': '245 158 11',
							'--color-success-500': '34 197 94',
							'--color-warning-500': '245 158 11',
							'--color-error-500': '239 68 68',
							'--on-primary': '255 255 255',
							'--on-surface': '248 250 252',
							'--on-tertiary': '0 0 0',
							'--on-success': '0 0 0',
							'--on-warning': '0 0 0',
							'--on-error': '255 255 255'
						}
					}
				]
			}
		})
	]
};

export default config;
