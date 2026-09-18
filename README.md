# query-keys

A fully typed, simple utility for your query keys.

## Installation

```sh
pnpm add query-keys
# or
npm install query-keys
# or
bun add query-keys
# or
yarn add query-keys
```

## Usage

Create your query keys object for your whole app, or for a specific part:

```ts
import { createQueryKeys } from "query-keys";

export const queryKeys = createQueryKeys({
	todos: {
		all: null, // ["todos", "all"]
		id: (id: number) => id, // ["todos", "id", <id>]
	},
});

// or:

export const todoQueryKeys = createQueryKeys("todos", {
	all: null, // ["todos", "all"]
	id: (id: number) => id, // ["todos", "id", <id>]
});
```

Then, use your keys like:

```ts
const { data: allTodos } = useQuery({
	queryKey: queryKeys.todos.all, // typed!
	queryFn: async () => {
		// ...
	},
});

const { data: specificTodo } = useQuery({
	queryKey: todoQueryKeys.id(todoId), // typed!
	queryFn: async () => {
		// ...
	},
});
```

Use `null` to let the object key be the query key. Use a string or a number, or an array of string or numbers to add specific keys to the query key.
Use a function to get a dynamic query key depending on an external parameter.

## `_def`

Every level exposes a `_def` property holding the path that leads to it. Use it to invalidate or match a whole subtree, or a dynamic key without its parameters:

```ts
const apiKeys = createQueryKeys("api", {
	users: {
		all: null,
		byId: (id: string) => id,
		filters: ["active", "pending"],
	},
});

apiKeys._def; // ["api"]
apiKeys.users._def; // ["api", "users"]
apiKeys.users.all._def; // ["api", "users", "all"]
apiKeys.users.byId._def; // ["api", "users", "byId"]
apiKeys.users.filters._def; // ["api", "users", "filters"]

queryClient.invalidateQueries({ queryKey: apiKeys.users.byId._def });
```

`createQueryKeys` without a root prefix does not expose `_def` on the returned object, since its path is empty. On leaf keys, `_def` is non-enumerable, so the key still serializes and hashes as a plain array.

## Credit

The API is very much inspired by [@lukemorales/query-key-factory](https://npmx.dev/package/@lukemorales/query-key-factory), but with Tanstack Query's [Options API](https://tkdodo.eu/blog/the-query-options-api) I do not see the need for such a powerhouse anymore.

## License

MIT
