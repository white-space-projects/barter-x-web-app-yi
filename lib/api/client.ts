export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  const json = await res.json();

  // 👇 handle Laravel resource + normal response
  if (json && typeof json === "object" && "data" in json) {
    return json.data;
  }

  return json;
}