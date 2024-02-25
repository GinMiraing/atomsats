import axios from "axios";

export const AxiosInstance = axios.create({
  timeout: 10000,
});
