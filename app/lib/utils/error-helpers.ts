import { isAxiosError } from "axios";

export const errorResponse = (code: number) => {
  return {
    data: null,
    error: true,
    code,
  };
};

export const formatError = (error: unknown) => {
  if (isAxiosError(error)) {
    return error.response?.data;
  } else if (error instanceof Error) {
    console.log(error);
    return ErrorMap[error.message as keyof typeof ErrorMap] || error.message;
  } else if (typeof error === "object" && error && "message" in error) {
    return error.message;
  }

  return "an unknown error occurred";
};

const ErrorMap = {
  "10001": "Bad request",
  "10002": "Not found",
  "10003": "Not a dmitem",
  "10004": "Get dmitem content type failed",
  "10005": "Invalid lock hash",
  "10006": "Invalid atomical id",
  "10007": "Unsupported atomical subtype",
  "10008": "Atomical UTXO not matching",
  "10009": "Atomical not owned by the address",
  "10010": "Invalid PSBT input",
  "10011": "PSBT not finalized",
  "10012": "Invalid address",
  "10013": "Price is less than 546 sats - (dust value)",
  "10014": "Price is not an integer",
  "10015": "No available UTXOs",
  "10016": "Psbt not match",
  "20001": "Internal server error",
  "20002": "Market API crashed",
  "20003": "Electrum API failed",
};
