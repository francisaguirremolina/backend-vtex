import { Router, RequestHandler } from 'express';

const addWrapperToRouterHandlers = (router: Router, wrapper: Function) => {
	// eslint-disable-next-line
	for (const route of router.stack) {
		if (route.route) {
			const lastHandlerIndex = route.route.stack.length - 1;
			const handler = route.route.stack[lastHandlerIndex];
			if (handler) {
				route.route.stack[lastHandlerIndex]!.handle = wrapper(handler.handle);
			}
		} else if (route.name === 'router') {
			// @ts-ignore
			addWrapperToRouterHandlers(route.handle, wrapper);
		}
	}
};

export const functionCatchWrapper =
	(fn: Function): RequestHandler =>
	(req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch((err) => next(err));
	};

export const routerCatchWrapper = (router: Router) => {
	addWrapperToRouterHandlers(router, functionCatchWrapper);
};
