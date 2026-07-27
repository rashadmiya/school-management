import axios from "axios";
import { server } from "@/utils/server";

export const axiosBaseQuery =
  ({ baseUrl = server } = {}) =>
  async ({ url, method, data, responseType, onDownloadProgress, onUploadProgress }) => {
    try {
      const result = await axios({
        url: `${baseUrl}${url}`,
        method,
        data,
        withCredentials: true,
        responseType,
        onDownloadProgress,
        onUploadProgress,
      });
      return { data: result.data };
    } catch (error) {
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data || error.message,
        },
      };
    }
  };
