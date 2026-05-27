import { describe, expect, it } from "vitest";
import { createQueryKeys } from "./";

describe("createQueryKeys", () => {
	it("creates query keys with string values", () => {
		const keys = createQueryKeys({
			user: "detail",
		});

		expect(keys.user).toEqual(["user", "detail"]);
	});

	it("creates query keys with number values", () => {
		const keys = createQueryKeys({
			version: 1,
		});

		expect(keys.version).toEqual(["version", 1]);
	});

	it("creates query keys with null values", () => {
		const keys = createQueryKeys({
			all: null,
		});

		expect(keys.all).toEqual(["all"]);
	});

	it("creates query keys with array values", () => {
		const keys = createQueryKeys({
			filters: ["active", "pending"],
		});

		expect(keys.filters).toEqual(["filters", "active", "pending"]);
	});

	it("creates query keys with functions", () => {
		const keys = createQueryKeys({
			byId: (id: string) => id,
		});

		expect(keys.byId("123")).toEqual(["byId", "123"]);
	});

	it("creates query keys with function returning array", () => {
		const keys = createQueryKeys({
			filtered: (status: string, limit: number) => [status, limit],
		});

		expect(keys.filtered("active", 10)).toEqual(["filtered", "active", 10]);
	});

	it("creates nested query keys", () => {
		const keys = createQueryKeys({
			users: {
				all: null,
				byId: (id: string) => id,
			},
		});

		expect(keys.users.all).toEqual(["users", "all"]);
		expect(keys.users.byId("456")).toEqual(["users", "byId", "456"]);
	});

	it("creates query keys with root prefix", () => {
		const keys = createQueryKeys("api", {
			users: null,
		});

		expect(keys.users).toEqual(["api", "users"]);
	});

	it("creates nested query keys with root prefix", () => {
		const keys = createQueryKeys("api", {
			users: {
				all: null,
				byId: (id: string) => id,
			},
		});

		expect(keys.users.all).toEqual(["api", "users", "all"]);
		expect(keys.users.byId("789")).toEqual(["api", "users", "byId", "789"]);
	});

	it("throws error when definition is missing", () => {
		// @ts-expect-error testing error case
		expect(() => createQueryKeys(undefined)).toThrow("Query keys definition is required");
	});

	it("creates deeply nested query keys", () => {
		const keys = createQueryKeys({
			api: {
				users: {
					active: {
						byId: (id: string) => id,
					},
				},
			},
		});

		expect(keys.api.users.active.byId("100")).toEqual(["api", "users", "active", "byId", "100"]);
	});

	it("creates query keys with multiple function parameters", () => {
		const keys = createQueryKeys({
			search: (query: string, page: number, limit: number) => [query, page, limit],
		});

		expect(keys.search("test", 1, 20)).toEqual(["search", "test", 1, 20]);
	});

	it("creates query keys with mixed nested structure", () => {
		const keys = createQueryKeys({
			posts: {
				all: null,
				byId: (id: number) => id,
				comments: {
					all: null,
					byPostId: (postId: number) => postId,
				},
			},
		});

		expect(keys.posts.all).toEqual(["posts", "all"]);
		expect(keys.posts.byId(42)).toEqual(["posts", "byId", 42]);
		expect(keys.posts.comments.all).toEqual(["posts", "comments", "all"]);
		expect(keys.posts.comments.byPostId(42)).toEqual(["posts", "comments", "byPostId", 42]);
	});

	it("creates query keys with empty array", () => {
		const keys = createQueryKeys({
			empty: [],
		});

		expect(keys.empty).toEqual(["empty"]);
	});

	it("creates query keys with zero as number value", () => {
		const keys = createQueryKeys({
			count: 0,
		});

		expect(keys.count).toEqual(["count", 0]);
	});

	it("creates query keys with function returning object properties", () => {
		const keys = createQueryKeys({
			filter: (params: { status: string; type: string }) => [params.status, params.type],
		});

		expect(keys.filter({ status: "active", type: "user" })).toEqual(["filter", "active", "user"]);
	});

	it("creates query keys with nested functions and arrays", () => {
		const keys = createQueryKeys({
			data: {
				list: ["sorted", "filtered"],
				paginated: (page: number) => page,
			},
		});

		expect(keys.data.list).toEqual(["data", "list", "sorted", "filtered"]);
		expect(keys.data.paginated(5)).toEqual(["data", "paginated", 5]);
	});

	it("creates query keys with root prefix and nested functions", () => {
		const keys = createQueryKeys("v1", {
			resources: {
				fetch: (id: string, options: string) => [id, options],
			},
		});

		expect(keys.resources.fetch("res-1", "detailed")).toEqual([
			"v1",
			"resources",
			"fetch",
			"res-1",
			"detailed",
		]);
	});

	it("creates query keys with boolean in function return", () => {
		const keys = createQueryKeys({
			toggle: (enabled: boolean) => enabled,
		});

		expect(keys.toggle(true)).toEqual(["toggle", true]);
		expect(keys.toggle(false)).toEqual(["toggle", false]);
	});

	it("creates complex real-world query key structure", () => {
		const keys = createQueryKeys("app", {
			users: {
				all: null,
				detail: (id: string) => id,
				posts: (userId: string) => ({
					list: null,
					byId: (postId: string) => [userId, postId],
				}),
			},
			settings: {
				theme: "dark",
				locale: "en",
			},
		});

		expect(keys.users.all).toEqual(["app", "users", "all"]);
		expect(keys.users.detail("user-1")).toEqual(["app", "users", "detail", "user-1"]);
		expect(keys.settings.theme).toEqual(["app", "settings", "theme", "dark"]);
	});

	it("does not add _def property to root object without prefix", () => {
		const keys = createQueryKeys({
			users: null,
		});

		// @ts-expect-error _def should not exist on root object
		expect(keys._def).toBeUndefined();
	});

	it("adds _def property to root object with prefix", () => {
		const keys = createQueryKeys("api", {
			users: null,
		});

		expect(keys._def).toEqual(["api"]);
	});

	it("adds _def property to nested objects", () => {
		const keys = createQueryKeys({
			users: {
				all: null,
			},
		});

		expect(keys.users._def).toEqual(["users"]);
	});

	it("adds _def property to deeply nested objects", () => {
		const keys = createQueryKeys({
			api: {
				v1: {
					users: {
						all: null,
					},
				},
			},
		});

		// @ts-expect-error _def should not exist on root object
		expect(keys._def).toBeUndefined();
		expect(keys.api._def).toEqual(["api"]);
		expect(keys.api.v1._def).toEqual(["api", "v1"]);
		expect(keys.api.v1.users._def).toEqual(["api", "v1", "users"]);
	});

	it("adds _def property with root prefix to nested objects", () => {
		const keys = createQueryKeys("root", {
			users: {
				active: {
					all: null,
				},
			},
		});

		expect(keys._def).toEqual(["root"]);
		expect(keys.users._def).toEqual(["root", "users"]);
		expect(keys.users.active._def).toEqual(["root", "users", "active"]);
	});
});
