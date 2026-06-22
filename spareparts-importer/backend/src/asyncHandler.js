// Wraps an async route so any thrown error is passed to Express's error
// handler automatically -> no try/catch needed in every controller.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
