import { getServerSession } from "next-auth"

export async function PUT(request: Request, response: Response) {
  const session = await getServerSession(request, response, authOptions);
}
