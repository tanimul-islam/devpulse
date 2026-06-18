import type { NextFunction, Request, Response } from "express";

type TAsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

const catchAsync = (fn: TAsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
