import axios from "axios";

const AxiosInstance = axios.create({
  timeout: 1000 * 10,
});

export default AxiosInstance;
