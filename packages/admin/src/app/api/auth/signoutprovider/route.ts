import { getServerSession } from "next-auth"
import { authOptions } from "./[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  console.log("HEYYY")
  // const session = await getServerSession(request, authOptions);
  // console.log(session);

  return new NextResponse('Success', {
    status: 200
  });
}
