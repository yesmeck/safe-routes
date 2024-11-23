import * as fs from 'fs';
import * as path from 'path';
import { expect, test } from 'vitest';
import { build } from '../src/build';
import { config } from './config';


test('gen route types', async () => {
  const root = fs.mkdtempSync('react-router-routes');

  await build(root, config, { outputDirPath: './node_modules', strict: false });

  expect(
    fs.readFileSync(path.join(root, '/node_modules/react-router-routes.d.ts'), 'utf8'),
  ).toMatchSnapshot();
});
