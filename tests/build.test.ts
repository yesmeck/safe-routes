import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { expect, test } from 'vitest';
import { build } from '../src/build';
import { testRoutes } from './config';


test('gen route types', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'safe-routes-'));
  const config = {
    appDirectory: path.join(root, "app"),
    routes: testRoutes,
  }

  await build(root, config, { outputDirPath: './node_modules', strict: false });

  expect(
    fs.readFileSync(path.join(root, 'node_modules/safe-routes.d.ts'), 'utf8'),
  ).toMatchSnapshot();
});
