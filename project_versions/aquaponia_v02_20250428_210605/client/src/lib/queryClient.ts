import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>;
  }
): Promise<Response> {
  // Merge headers
  const headers = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {})
  };
  
  // Add timestamp parameter to URL for cache busting
  const urlWithCache = url.includes('?') 
    ? `${url}&_t=${Date.now()}` 
    : `${url}?_t=${Date.now()}`;
  
  const res = await fetch(urlWithCache, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add timestamp to URL for cache busting
    const url = queryKey[0] as string;
    const urlWithCache = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
      
    const res = await fetch(urlWithCache, {
      credentials: "include",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
