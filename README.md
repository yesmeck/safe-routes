# safe-routes

> [!note]
> remix-routes has been renamed to safe-routes. If you are looking for the documentation of remix-routes, please refer to [here](https://github.com/yesmeck/remix-routes/tree/remix-routes).

Type-safe helper for manipulating internal links in your React Router apps.

## Features

- [safe-routes](#safe-routes)
  - [Features](#features)
  - [Installation](#installation)
  - [Setup](#setup)
  - [Usage](#usage)
    - [Typed URL generation](#typed-url-generation)
    - [Appending query string](#appending-query-string)
    - [Typed query string](#typed-query-string)
    - [Typed route ids](#typed-route-ids)
    - [Basename support](#basename-support)
  - [License](#license)

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

### Typed URL generation

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

### Typed route ids

safe-routes exports the `RouteId` type definition with the list of all valid route ids for your repository, and has a helper function `$routeId` that tells typescript to restrict the given string to one of the valid RouteId values.

```typescript
import type { RouteId } from 'safe-routes';
import type { loader as postsLoader } from './_layout.tsx';
import { useRouteLoaderData } from 'react-router';
import { $routeId } from 'safe-routes';

export default function Post() {
  const postList = useRouteLoaderData<typeof postsLoader>($routeId('routes/posts/_layout'));
}
```

### Basename support

Basename is supported out of the box. If you have set a basename in your `vite.config.ts` and `react-router.config.ts`, safe-routes will automatically prepend the basename to the generated URLs.

```typescript
// react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  basename: "/blog",
} satisfies Config;
```

```typescript
import { $path } from 'safe-routes';

$path('/posts/:id', { id: 6 }); // => /blog/posts/6
```

## License

[MIT](LICENSE)
