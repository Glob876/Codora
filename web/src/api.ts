export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
const fragment = location.hash.slice(1);
if (/^[0-9a-f]{64}$/.test(fragment)) {
  sessionStorage.setItem("typoha-token", fragment);
  history.replaceState(null, "", location.pathname);
}
export const token = sessionStorage.getItem("typoha-token") || "";
export let workspaceScope = "";
export async function api<T = any>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "x-typoha-token": token,
      ...(workspaceScope ? { "x-typoha-workspace": workspaceScope } : {}),
      ...(data !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new ApiError(err.error || response.statusText, response.status);
  }
  const result = await response.json();
  if (path === "workspace") workspaceScope = result.id || "";
  return result;
}
export function assetUrl(path: string) {
  return `/api/asset?path=${encodeURIComponent(path)}&token=${token}&workspace=${workspaceScope}`;
}
export function bytesToBase64(bytes: Uint8Array) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192)
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
export function download(
  data: Blob | string,
  name: string,
  type = "text/plain;charset=utf-8",
) {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
