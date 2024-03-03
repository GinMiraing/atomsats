import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import {
  AtomicalUnionResponse,
  isCONTAINER,
  isFT,
  isREALM,
} from "../apis/atomical/type";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatAddress = (address: string, digist = 4) => {
  return `${address.slice(0, digist)}...${address.slice(-digist)}`;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const satsToBTC = (
  sats: number,
  options?: { digits?: number; keepTrailingZeros?: boolean },
) => {
  const { digits = 8, keepTrailingZeros = false } = options || {};
  const result = (sats / 10 ** 8).toFixed(digits);
  return keepTrailingZeros ? result : parseFloat(result).toString();
};

export const formatNumber = (
  value: number,
  options?: { precision?: number },
): string => {
  const { precision = 2 } = options || {};

  let formatted = value.toFixed(precision);
  formatted = parseFloat(formatted).toString();

  const [integerPart, decimalPart] = formatted.split(".");
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart ? `${integerFormatted}.${decimalPart}` : integerFormatted;
};

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

const isObject = (o: any) => {
  return o === Object(o) && !Array.isArray(o) && typeof o !== "function";
};

export const keysToCamel = (o: any): any => {
  if (isObject(o)) {
    const n = {};
    Object.keys(o).forEach((k) => {
      (n as any)[toCamelCase(k)] = keysToCamel((o as any)[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => {
      return keysToCamel(i);
    });
  }
  return o;
};

export const getFileExtension = (filename: string) => {
  const reversedFilename = filename.split("").reverse().join("");

  const extension = reversedFilename.substring(
    0,
    reversedFilename.indexOf("."),
  );

  return extension.split("").reverse().join("");
};

export const getAtomicalContent = (atomical: AtomicalUnionResponse) => {
  const result = {
    contentType: "",
    content: "",
  };

  if (isFT(atomical)) {
    result.content = atomical.$request_ticker;
    return result;
  }

  if (isREALM(atomical)) {
    result.content = atomical.$full_realm_name || atomical.$request_realm;
    return result;
  }

  if (isCONTAINER(atomical)) {
    result.content = atomical.$request_container;
    return result;
  }

  if (!atomical.mint_data || !atomical.mint_data.fields) {
    return result;
  }

  const data = Object.entries(atomical.mint_data.fields).filter(
    (v) => v[0] !== "args",
  );

  if (data.length === 0) {
    return result;
  }

  result.contentType = getFileExtension(data[0][0]).toLowerCase();

  if ("$b" in data[0][1]) {
    if (typeof data[0][1]["$b"] === "string") {
      result.content = data[0][1]["$b"];
    } else {
      if (
        "$b" in data[0][1]["$b"] &&
        typeof data[0][1]["$b"]["$b"] === "string"
      ) {
        result.content = data[0][1]["$b"]["$b"];
      }
    }
  }

  return result;
};
