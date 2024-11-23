#!/usr/bin/env node
import path from 'node:path';
import { createContext } from './vite-node.js';

async function run() {
  const { runner, server } = await createContext();
  await runner.executeFile(path.resolve(import.meta.dirname, '../dist/empty.js'));
  await server.close();
}

run();
