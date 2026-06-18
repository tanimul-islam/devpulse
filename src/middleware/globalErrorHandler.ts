import type { ErrorRequestHandler } from "express";

type TError = Error & {
  statusCode?: number;
};

const globalErrorHandler: ErrorRequestHandler = (
  err: TError,
  req,
  res,
  next,
) => {
  const statusCode = err.statusCode || 500;

  const message =
    process.env.NODE_ENV === "production"
      ? err.message || "Something went wrong"
      : err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      message,
    },
  });
};

export default globalErrorHandler;
