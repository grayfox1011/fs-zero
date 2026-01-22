#!/usr/bin/env node

import { icAgent } from './actor.mjs';
import { Actor } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';
import { idlFactory } from '../src/declarations/satellite/satellite.factory.did.mjs';
import { readJunoConfig } from './console.deploy.utils.mjs';
import { targetMainnet } from './utils.mjs';
import { getIdentity } from './console.config.utils.mjs';

const satelliteId = 'hamjq-waaaa-aaaal-asviq-cai';
const mainnet = targetMainnet();

console.log('🔐 Configuring Internet Identity authentication for satellite:', satelliteId);

// Use the saved identity (not generate a new one)
console.log('Loading saved Juno identity...');
const identity = await getIdentity(mainnet);
console.log('✅ Identity:', identity.getPrincipal().toText());

// Use Internet Identity (simpler, no external config needed)
const authConfig = {
  internet_identity: [{ derivation_origin: [], external_alternative_origins: [] }],
  rules: [],
  version: [],
  openid: [] // No OpenID/Google needed
};

console.log('✅ Internet Identity will be used (no Google config needed)');

console.log('Creating agent...');
const agent = await icAgent();

console.log('Creating actor...');
const actor = Actor.createActor(idlFactory, {
  agent,
  canisterId: Principal.fromText(satelliteId)
});

try {
  // First, check current auth config
  console.log('Checking current auth config...');
  const currentConfig = await actor.get_auth_config();

  if (!currentConfig) {
    console.log('❌ No auth config found. Setting it now...');
  } else {
    console.log('✅ Current auth config found. Updating...');
  }

  // Set the auth config
  console.log('Setting Internet Identity authentication...');
  const result = await actor.set_auth_config({
    ...authConfig,
    version: currentConfig?.version ?? []
  });

  console.log('✅ Internet Identity authentication configured successfully!');
  console.log('Result:', JSON.stringify(result, (k, v) =>
    typeof v === 'bigint' ? v.toString() : v, 2
  ));

} catch (e) {
  console.error('❌ Error configuring authentication:', e.message);
  process.exit(1);
}
