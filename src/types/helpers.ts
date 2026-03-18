export type Promisable<T> = T | Promise<T>;

export type OtherArgs = Record<string, unknown>;

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};
