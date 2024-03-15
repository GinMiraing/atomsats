import { isAxiosError } from "axios";

export const formatError = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data;
  } else if (error instanceof Error) {
    return ErrorMap[error.message as keyof typeof ErrorMap] || error.message;
  }

  return "an unknown error occurred";
};

const ErrorMap = {
  "10001": "bad request",
  "10002": "not found",
  "10003": "not a dmitem",
  "10004": "get dmitem content type failed",
  "20001": "internal server error",
  "20002": "market api crashed",
  "20003": "electrum api failed",
};
