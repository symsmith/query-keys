interface NestedKeys {
	[key: string]:
		| ((...args: never[]) => unknown)
		| string
		| number
		| null
		| NestedKeys;
}

export type QueryKeys<Path extends string[], KeysDef extends NestedKeys> = {
	[K in keyof KeysDef]: KeysDef[K] extends (...args: infer Args) => infer Return
		? (
				...args: Args
			) => [...Path, K, ...(Return extends unknown[] ? Return : [Return])]
		: KeysDef[K] extends NestedKeys
			? K extends string
				? QueryKeys<[...Path, K], KeysDef[K]>
				: never
			: KeysDef[K] extends string | number
				? [...Path, K, KeysDef[K] extends string | number ? KeysDef[K] : never]
				: KeysDef[K] extends null
					? [...Path, K]
					: never;
};

function recCreateQueryKeys<Root extends string[], KeysDef extends NestedKeys>(
	root: Root,
	definition: KeysDef,
) {
	const result: Record<string, unknown> = { _def: root };
	for (const key in definition) {
		if (!Object.hasOwn(definition, key)) continue;

		const element = definition[key];

		if (typeof element === "function") {
			// @ts-expect-error complex type inference not working here
			result[key] = (...args: Parameters<typeof element>) => {
				const ret = element(...args);
				return [...root, key, ...(Array.isArray(ret) ? ret : [ret])];
			};
		} else if (typeof element === "object" && element !== null) {
			result[key] = recCreateQueryKeys([...root, key], element);
		} else {
			const lastKey = Array.isArray(element)
				? element
				: element === null
					? []
					: [element];
			result[key] = [...root, key, ...lastKey];
		}
	}
	return result as QueryKeys<Root, KeysDef>;
}

export function createQueryKeys<
	Root extends string,
	KeysDef extends NestedKeys,
>(root: Root, definition: KeysDef) {
	return recCreateQueryKeys([root], definition);
}
