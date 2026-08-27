// app/api/socket/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Socket.IO server is running',
  });
}
