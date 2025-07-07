import { container } from "@/app/lib/container";
import { Sample } from "@/app/lib/sample";

export async function GET(request: Request) {
  const sample = container.resolve(Sample);

  return new Response(JSON.stringify({ response: sample.get() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
