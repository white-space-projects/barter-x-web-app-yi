import { getSession } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_API_URL!;

function buildUrl(path?: string[]) {
    console.log(`${BASE}/${path?.join("/") || ""}`)
  if (!path || path.length === 0) return BASE;
  return `${BASE}/${path.join("/")}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {

  const { path } = await params; // ✅ IMPORTANT: await params
    const session:any = await getSession()
    if(!session){
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } 
     

  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    credentials: "include",
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}
