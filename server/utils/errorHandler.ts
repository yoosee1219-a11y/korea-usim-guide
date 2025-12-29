import { Response } from 'express';

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Handles API errors with consistent error response format
 *
 * @param res - Express Response object
 * @param error - The error object (unknown type for safety)
 * @param context - Context string describing where the error occurred
 *
 * @example
 * try {
 *   const data = await fetchData();
 *   handleSuccess(res, data);
 * } catch (error) {
 *   handleApiError(res, error, 'Failed to fetch data');
 * }
 */
export function handleApiError(
  res: Response,
  error: unknown,
  context: string
): void {
  console.error(`${context} error:`, error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: ErrorResponse = {
    success: false,
    error: context,
    ...(isDevelopment && { details: errorMessage })
  };

  // Determine status code based on error type
  let statusCode = 500;
  if (errorMessage.includes('not found')) statusCode = 404;
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) statusCode = 401;
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) statusCode = 400;

  res.status(statusCode).json(response);
}

/**
 * Handles successful API responses with consistent format
 *
 * @param res - Express Response object
 * @param data - The data to return in the response
 *
 * @example
 * const tips = await getTips(filters);
 * handleSuccess(res, tips);
 */
export function handleSuccess<T>(res: Response, data: T): void {
  const response: SuccessResponse<T> = {
    success: true,
    data
  };
  res.json(response);
}
