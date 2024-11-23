# safe-routes

Type-safe helper for manipulating internal links in your React Router apps.

## Installation

```bash
$ npm add safe-routes
```

## Setup

Add `safeRoutes` plugin to your `vite.config.ts`:

```javascript
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { safeRoutes } from 'safe-routes/vite';

export default defineConfig({
  plugins: [
    reactRouter(),
    safeRoutes(),
  ],
});
```

Supported config options:

- `strict: boolean`
- `outDir: string`

## Usage

### Basic usage

```typescript
import { redirect } from 'react-router';
import { $path } from 'safe-routes'; // <-- Import magical $path helper from safe-routes.

export const action = async ({ request }) => {
  let formData = await request.formData();
  const post = await createPost(formData);

  return redirect($path('/posts/:id', { id: post.id })); // <-- It's type safe.
};
```

### Appending query string

```typescript
import { $path } from 'safe-routes';

$path('/posts/:id', { id: 6 }, { version: 18 }); // => /posts/6?version=18
$path('/posts', { limit: 10 }); // => /posts?limit=10
// You can pass any URLSearchParams init as param
$path('/posts/delete', [['id', 1], ['id', 2]]); // => /posts/delete?id=1&id=2
```

### Typed query string

Define type of query string by exporting a type named `SearchParams` in route file:

```typescript
// app/routes/posts.tsx

export type SearchParams = {
  view: 'list' | 'grid',
  sort?: 'date' | 'views',
  page?: number,
}
```

```typescript
import { $path } from 'safe-routes';

// The query string is type-safe.
$path('/posts', { view: 'list', sort: 'date', page: 1 });
```

You can combine this feature with [zod](https://github.com/colinhacks/zod) and [remix-params-helper](https://github.com/kiliman/remix-params-helper) to add runtime params checking:

```typescript
import { z } from "zod";
import { getSearchParams } from "remix-params-helper";

const SearchParamsSchema = z.object({
  view: z.enum(["list", "grid"]),
  sort: z.enum(["price", "size"]).optional(),
  page: z.number().int().optional(),
})

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export const loader = async (request) => {
  const result = getSearchParams(request, SearchParamsSchema)
  if (!result.success) {
    return json(result.errors, { status: 400 })
  }
  const { view, sort, page } = result.data;
}
```

### Checking params

```typescript
import { useParams } from "react-router";
import { $params } from 'safe-routes'; // <-- Import $params helper.

export const action = async ({ params }) => {
  const { id } = $params("/posts/:id/update", params) // <-- It's type safe, try renaming `id` param.

  // ...
}

export default function Component() {
  const params = useParams();
  const { id } = $params("/posts/:id/update", params);
  ...
}
```

### $routeId helper for useRouteLoaderData route ids

safe-routes exports the `RouteId` type definition with the list of all valid route ids for your repository, and has a helper function `$routeId` that tells typescript to restrict the given string to one of the valid RouteId values.

```typescript
import type { RouteId } from 'safe-routes';
import type { loader as postsLoader } from './_layout.tsx';
import { useRouteLoaderData } from 'react-router';
import { $routeId } from 'safe-routes';

export default function Post() {
  const postList = useRouteLoaderData<typeof postsLoader>($routeId('routes/posts/_layout'));
```

## Command Line Options

- `-s`: Enale strict mode. In strict mode only routes that define `SearchParams` type are allowed to have query string.
- `-o`: Specify the output path for `safe-routes.d.ts`. Defaults to `./node_modules` if arg is not given.

## License

[MIT](LICENSE)
