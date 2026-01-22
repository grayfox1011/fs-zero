import { defineConsoleConfig } from '@junobuild/config';

/** @type {import('@junobuild/config').JunoConsoleConfig} */
export default defineConsoleConfig(({ mode }) => ({
	id: 'hamjq-waaaa-aaaal-asviq-cai',
	source: 'build',
	...(['development', 'production'].includes(mode) && {
		authentication: {
			internetIdentity: {
				// Internet Identity funziona out-of-the-box, nessuna configurazione esterna necessaria
			}
		}
	})
}));
