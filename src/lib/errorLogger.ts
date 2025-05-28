import { postJsonWithRetry } from "./api";

export async function logClientError(
  error: Error,
  info?: React.ErrorInfo
) {
  try {
    await postJsonWithRetry("/api/log-error", {
      message: error.message,
      stack: error.stack,
      source: "client",
      context: info,
    });
  } catch (err) {
    console.error("Failed to log client error", err);
  }
}
