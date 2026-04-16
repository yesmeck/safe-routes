import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import { createContext } from '../src/vite-node';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const safeRoutesPluginUrl = pathToFileURL(path.join(repoRoot, 'src/vite.ts')).href;
const safeRoutesRuntimePath = path.join(repoRoot, 'src/index.ts');
const emptyModulePath = path.join(repoRoot, 'src/empty.ts');

function writeFixture(root: string) {
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2),
  );

  fs.mkdirSync(path.join(root, 'app', 'routes'), { recursive: true });

  fs.writeFileSync(
    path.join(root, 'vite.config.ts'),
    `import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { safeRoutes } from ${JSON.stringify(safeRoutesPluginUrl)};

export default defineConfig({
  resolve: {
    alias: {
      "safe-routes": ${JSON.stringify(safeRoutesRuntimePath)},
    },
  },
  plugins: [reactRouter(), safeRoutes({ outDir: ".generated" })],
});
`,
  );

  fs.writeFileSync(
    path.join(root, 'react-router.config.ts'),
    `import type { Config } from "@react-router/dev/config";

export default {
  basename: "/blog",
} satisfies Config;
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'root.tsx'),
    `import { Outlet } from "react-router";

export default function Root() {
  return <Outlet />;
}
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'entry.client.tsx'),
    `export {};
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'entry.server.tsx'),
    `export default function handleRequest() {
  return new Response("");
}
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'routes.ts'),
    `import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts.tsx"),
  route("posts/:id", "routes/posts.$id.tsx"),
] satisfies RouteConfig;
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'routes', 'home.tsx'),
    `export default function Home() {
  return <div>home</div>;
}
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'routes', 'posts.tsx'),
    `export type SearchParams = {
  view: "list" | "grid";
};

export default function Posts() {
  return <div>posts</div>;
}
`,
  );

  fs.writeFileSync(
    path.join(root, 'app', 'routes', 'posts.$id.tsx'),
    `export default function Post() {
  return <div>post</div>;
}
`,
  );
}

async function withFixture(
  run: (context: {
    fixtureRoot: string;
    generatedTypesPath: string;
    runner: Awaited<ReturnType<typeof createContext>>['runner'];
    server: Awaited<ReturnType<typeof createContext>>['server'];
  }) => Promise<void>,
) {
  const fixtureRoot = fs.mkdtempSync(
    path.join(repoRoot, 'node_modules', '.tmp-safe-routes-'),
  );
  const generatedTypesPath = path.join(fixtureRoot, '.generated', 'safe-routes.d.ts');
  const previousCwd = process.cwd();

  writeFixture(fixtureRoot);
  process.chdir(fixtureRoot);

  const { runner, server } = await createContext();

  try {
    await runner.executeFile(emptyModulePath);
    await run({ fixtureRoot, generatedTypesPath, runner, server });
  } finally {
    await server.close();
    process.chdir(previousCwd);
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

describe('safeRoutes vite plugin e2e', () => {
  test('applies basename to runtime path helpers', async () => {
    await withFixture(async ({ fixtureRoot, runner }) => {
      const basenameTestModulePath = path.join(fixtureRoot, 'app', 'basename-test.ts');

      fs.writeFileSync(
        basenameTestModulePath,
        `import { $path } from "safe-routes";

export default $path("/posts");
`,
      );

      const basenameTestModule = await runner.executeFile(basenameTestModulePath);

      expect(basenameTestModule.default).toBe('/blog/posts');
    });
  });

  test('generates route types for a React Router app', async () => {
    await withFixture(async ({ generatedTypesPath }) => {
      await vi.waitFor(
        () => expect(fs.existsSync(generatedTypesPath)).toBe(true),
        { timeout: 10_000 },
      );

      const generatedTypes = fs.readFileSync(generatedTypesPath, 'utf8');

      expect(generatedTypes).toMatchSnapshot();
    });
  });

  test('updates generated types when routes change during dev', async () => {
    await withFixture(async ({ fixtureRoot, generatedTypesPath, server }) => {
      await vi.waitFor(
        () => expect(fs.existsSync(generatedTypesPath)).toBe(true),
        { timeout: 10_000 },
      );

      fs.writeFileSync(
        path.join(fixtureRoot, 'app', 'routes', 'admin.tsx'),
        `export default function Admin() {
  return <div>admin</div>;
}
`,
      );

      fs.writeFileSync(
        path.join(fixtureRoot, 'app', 'routes.ts'),
        `import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts.tsx"),
  route("posts/:id", "routes/posts.$id.tsx"),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
`,
      );

      const safeRoutesPlugin = server.config.plugins.find(
        (plugin) => plugin.name === 'safe-routes',
      );

      await safeRoutesPlugin?.watchChange?.(
        path.join(fixtureRoot, 'app', 'routes.ts').replaceAll(path.sep, '\\'),
      );

      await vi.waitFor(
        () =>
          expect(fs.readFileSync(generatedTypesPath, 'utf8')).toContain('"/admin": {'),
        { timeout: 10_000 },
      );

      const generatedTypes = fs.readFileSync(generatedTypesPath, 'utf8');

      expect(generatedTypes).toMatchSnapshot();
    });
  });
});
