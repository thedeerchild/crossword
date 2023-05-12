export type TimeoutWrapper<T> =
	| {
			isTimeout: true;
	  }
	| {
			isTimeout: false;
			result: T;
	  };

export async function promiseWithTimeout<T>(
	p: Promise<T>,
	timeoutDurationMs: number
): Promise<TimeoutWrapper<T>> {
	let timeout;
	const res = await Promise.race([
		// Wrap provided promise.
		(async () => ({ isTimeout: false, result: await p }))(),
		// Set timeout to race against promise.
		new Promise<{ isTimeout: true }>((resolve) => {
			timeout = setTimeout(() => {
				resolve({ isTimeout: true });
			}, timeoutDurationMs);
		})
	]);

	clearTimeout(timeout);
	return res;
}
