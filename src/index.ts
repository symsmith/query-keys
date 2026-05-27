interface NestedKeys {
	[key: string]:
		| ((...args: any[]) => unknown)
		| (string | number)[]
		| string
		| number
		| null
		| NestedKeys;
}

export type QueryKeys<
	Path extends string[] | undefined,
	KeysDef extends NestedKeys,
> = (Path extends undefined ? {} : { _def: Path }) & {
	[K in keyof KeysDef]: KeysDef[K] extends (...args: infer Args) => infer Return
		? (
				...args: Args
			) => [
				...(Path extends undefined ? [] : Path),
				K,
				...(Return extends unknown[] ? Return : [Return]),
			]
		: KeysDef[K] extends NestedKeys
			? K extends string
				? QueryKeys<[...(Path extends undefined ? [] : Path), K], KeysDef[K]>
				: never
			: KeysDef[K] extends (string | number)[]
				? [...(Path extends undefined ? [] : Path), K, ...KeysDef[K]]
				: KeysDef[K] extends string | number
					? [...(Path extends undefined ? [] : Path), K, KeysDef[K]]
					: KeysDef[K] extends null
						? [...(Path extends undefined ? [] : Path), K]
						: never;
};

function recCreateQueryKeys<Root extends string[], KeysDef extends NestedKeys>(
	root: Root,
	definition: KeysDef,
) {
	const result: Record<string, unknown> = root.length ? { _def: root } : {};
	for (const key in definition) {
		if (!Object.hasOwn(definition, key)) continue;

		const element = definition[key];

		if (typeof element === "function") {
			// @ts-expect-error complex type inference not working here
			result[key] = (...args: Parameters<typeof element>) => {
				const ret = element(...args);
				return [...root, key, ...(Array.isArray(ret) ? ret : [ret])];
			};
		} else if (typeof element === "object" && !Array.isArray(element) && element !== null) {
			result[key] = recCreateQueryKeys([...root, key], element);
		} else {
			const lastKey: unknown[] = Array.isArray(element)
				? element
				: element === null
					? []
					: [element];
			result[key] = [...root, key, ...lastKey];
		}
	}
	return result as QueryKeys<Root, KeysDef>;
}

/**
 * Creates a structured set of query keys based on the provided definition.
 *
 * ```ts
 *	const keys = createQueryKeys({
 *		users: {
 *			all: null,
 *			byId: (id: string) => id,
 *		},
 *	});
 *
 * console.log(keys.users.all); // Output: ["users", "all"]
 * console.log(keys.users.byId("123")); // Output: ["users", "byId", "123"]
 * ```
 */
export function createQueryKeys<KeysDef extends NestedKeys>(
	definition: KeysDef,
): QueryKeys<undefined, KeysDef>;
/**
 * Creates a structured set of query keys with a root prefix based on the provided definition.
 *
 * ```ts
 *	const apiKeys = createQueryKeys("api", {
 *		users: {
 *			all: null,
 *			byId: (id: string) => id,
 *		},
 *	});
 *
 * console.log(apiKeys.users.all); // Output: ["api", "users", "all"]
 * console.log(apiKeys.users.byId("123")); // Output: ["api", "users", "byId", "123"]
 * ```
 */
export function createQueryKeys<Root extends string, KeysDef extends NestedKeys>(
	root: Root,
	definition: KeysDef,
): QueryKeys<[Root], KeysDef>;
export function createQueryKeys<Root extends string, KeysDef extends NestedKeys>(
	rootOrDef: Root | KeysDef,
	defOrEmpty?: KeysDef,
) {
	const root = typeof rootOrDef === "string" ? [rootOrDef] : [];
	const def = typeof rootOrDef === "string" ? defOrEmpty : rootOrDef;

	if (def === undefined) {
		throw new Error("Query keys definition is required");
	}

	return recCreateQueryKeys(root, def) as QueryKeys<
		Root extends string ? [Root] : undefined,
		KeysDef
	>;
}
