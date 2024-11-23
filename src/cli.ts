#!/usr/bin/env node
import path from 'node:path';
import meow from 'meow';
import { DEFAULT_OUTPUT_DIR_PATH, build as typeGen } from './build.js';
import { runner, server } from './vite-node.js';


const helpText = `
Usage
$ remix-routes

Options
--strict, -s  Enable strict mode
--outputDirPath, -o Specify the output path for "remix-routes.d.ts". Defaults to "./node_modules" if arg is not given.
`;


const cli = meow(helpText, {
  flags: {
    strict: {
      type: 'boolean',
      alias: 's',
    },
    outputDirPath: {
      type: 'string',
      alias: 'o',
      default: DEFAULT_OUTPUT_DIR_PATH,
    }
  },
});

await runner.executeFile(path.resolve(import.meta.dirname, '../dist/empty.js'));
await server.close();
