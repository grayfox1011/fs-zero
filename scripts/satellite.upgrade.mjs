#!/usr/bin/env node

import { Principal } from '@icp-sdk/core/principal';
import { upgrade } from './module.upgrade.mjs';

await upgrade({
	sourceFilename: 'satellite.wasm.gz',
	canisterId: Principal.fromText('hamjq-waaaa-aaaal-asviq-cai')
});
