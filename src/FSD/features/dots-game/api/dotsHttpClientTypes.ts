import type { InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    dotsSilentError?: boolean;
  }
}

export type DotsApiErrorBody = Readonly<{
  code?: string;
  messageLocal?: string;
}>;

export type DotsHttpRequestConfig = InternalAxiosRequestConfig & Readonly<{ dotsSilentError?: boolean }>;
