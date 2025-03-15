// Define error types for consistent error handling
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Define a structured error interface
export interface AppError {
  type: ErrorType;
  message: string;
  status?: number;
  data?: any;
}

// Function to create consistent error objects
export function createError(
  type: ErrorType, 
  message: string, 
  status?: number, 
  data?: any
): AppError {
  return {
    type,
    message,
    status,
    data
  };
}

// Helper function to handle API responses
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const status = response.status;
    let errorType: ErrorType;
    let errorMessage: string;
    
    // Map HTTP status codes to error types
    switch (status) {
      case 400:
        errorType = ErrorType.VALIDATION;
        errorMessage = 'Invalid request parameters';
        break;
      case 401:
      case 403:
        errorType = ErrorType.AUTHORIZATION;
        errorMessage = 'You are not authorized to perform this action';
        break;
      case 404:
        errorType = ErrorType.NOT_FOUND;
        errorMessage = 'The requested resource was not found';
        break;
      case 500:
      case 502:
      case 503:
        errorType = ErrorType.SERVER;
        errorMessage = 'Server error occurred';
        break;
      default:
        errorType = ErrorType.UNKNOWN;
        errorMessage = 'An unexpected error occurred';
    }
    
    // Try to get the error details from the response
    try {
      const errorData = await response.json();
      throw createError(
        errorType,
        errorData.message || errorMessage,
        status,
        errorData
      );
    } catch (e) {
      // If we can't parse the JSON, just throw with the status message
      throw createError(
        errorType,
        errorMessage,
        status
      );
    }
  }
  
  // If response is OK, parse and return the data
  try {
    return await response.json() as T;
  } catch (error) {
    throw createError(
      ErrorType.UNKNOWN,
      'Failed to parse response data',
      response.status
    );
  }
} 