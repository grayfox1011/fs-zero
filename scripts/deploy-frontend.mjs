#!/usr/bin/env node

import { uploadAsset } from '@junobuild/storage';
import { icAgent } from './actor.mjs';
import { idlFactory } from '../src/declarations/satellite/satellite.factory.did.mjs';
import { Actor } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import { readFileSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const buildDir = join(__dirname, '../build');
const satelliteId = 'hamjq-waaaa-aaaal-asviq-cai';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'text/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm'
};

function getMimeType(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function getFiles(dir) {
  const dirents = readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const deploy = async () => {
  console.log('Initializing agent...');
  // Note: icAgent() internally uses getIdentity() which we patched to load from the correct path
  const agent = await icAgent();
  
  console.log('Creating actor for satellite:', satelliteId);
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: Principal.fromText(satelliteId)
  });

  if (!actor) {
      console.error('Failed to create actor');
      process.exit(1);
  }

  // Note: #dapp collection is a reserved collection in Juno, automatically configured
  console.log('Skipping #dapp collection configuration (reserved collection)...');

  const files = getFiles(buildDir);
  console.log(`Found ${files.length} files to upload from ${buildDir}...`);

  for (const file of files) {
    const relativePath = relative(buildDir, file);
    const key = '/' + relativePath.replace(/\\/g, '/');
    const mimeType = getMimeType(file);
    const data = readFileSync(file);
    const blob = new Blob([data]);
    
    console.log(`Uploading ${key} (${mimeType})...`);

    try {
      await uploadAsset({
        actor,
        asset: {
          filename: key,
          fullPath: key,
          collection: '#dapp', // Use #dapp for root hosting
          headers: [
            ['Content-Type', mimeType]
          ],
          data: blob,
          token: undefined, 
          encoding: undefined,
          description: undefined
        }
      });
    } catch (e) {
      console.error(`Failed to upload ${key}:`, e);
    }
  }
  
  console.log('Deploy complete!');
};

deploy();
