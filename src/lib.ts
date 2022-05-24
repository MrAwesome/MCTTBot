import type {z} from "zod";

/*
 * Acquires a mutex lock over the given key. If the lock can't be acquired, it waits until it's available.
 * @param key Key to get the lock for.
 * @return {Promise.<Function>} A Promise that resolves when the lock is acquired, with the function that
 * must be called to release the lock.
 */
// From: https://gist.github.com/shakahl/01fe4172efc64082237f0ee643ff55eb
const lockPromises: Map<string, Promise<unknown>> = new Map();
export const lockMutex = (key: string): Promise<CallableFunction> => {
    let unlockNext: CallableFunction;
    const willLock = new Promise(resolve => (unlockNext = resolve));
    const lockPromise = lockPromises.get(key) || Promise.resolve();
    const willUnlock = lockPromise.then(() => unlockNext);
    lockPromises.set(key, lockPromise.then(() => willLock));
    return willUnlock;
};

type ZStringLiteralUnion = z.ZodUnion<[z.ZodLiteral<string>, ...z.ZodLiteral<string>[]]>;
export function getLiteralsFromSchema(union: ZStringLiteralUnion): string[] {
    return union._def.options.map((x) => x._def.value);
}
