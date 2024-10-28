import {
  ErrorResponse,
  GetOptions,
  PatchOptions,
  PostOptions,
  PutOptions,
  SendMessageOptions,
  SendMessageResponse,
  TextfullyConfig,
} from "./interfaces";

const defaultBaseUrl = "https://api.textfully.dev/v1";
const defaultUserAgent = "textfully-node/0.1.0";

export class Textfully {
  private readonly headers: Headers;
  private readonly baseUrl: string;

  constructor(private readonly config: TextfullyConfig) {
    this.baseUrl = config.baseUrl || defaultBaseUrl;
    this.headers = new Headers({
      Authorization: `Bearer ${config.apiKey}`,
      "User-Agent": config.userAgent || defaultUserAgent,
      "Content-Type": "application/json",
    });
  }

  private async fetchRequest<T>(
    path: string,
    options = {}
  ): Promise<{ data: T | null; error: ErrorResponse | null }> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);

      if (!response.ok) {
        try {
          const rawError = await response.text();
          return { data: null, error: JSON.parse(rawError) };
        } catch (err) {
          if (err instanceof SyntaxError) {
            return {
              data: null,
              error: {
                name: "application_error",
                message:
                  "Internal server error. We're unable to process your request right now, please try again later.",
              },
            };
          }

          const error: ErrorResponse = {
            message: response.statusText,
            name: "application_error",
          };

          if (err instanceof Error) {
            return { data: null, error: { ...error, message: err.message } };
          }

          return { data: null, error };
        }
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          name: "application_error",
          message: "Unable to fetch data. The request could not be resolved.",
        },
      };
    }
  }

  async post<T>(path: string, entity?: unknown, options: PostOptions = {}) {
    const requestOptions = {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async get<T>(path: string, options: GetOptions = {}) {
    const requestOptions = {
      method: "GET",
      headers: this.headers,
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async put<T>(path: string, entity: unknown, options: PutOptions = {}) {
    const requestOptions = {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async patch<T>(path: string, entity: unknown, options: PatchOptions = {}) {
    const requestOptions = {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(entity),
      ...options,
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async delete<T>(path: string, query?: unknown) {
    const requestOptions = {
      method: "DELETE",
      headers: this.headers,
      body: JSON.stringify(query),
    };

    return this.fetchRequest<T>(path, requestOptions);
  }

  async send(options: SendMessageOptions) {
    return this.post<SendMessageResponse>("/messages", options);
  }
}