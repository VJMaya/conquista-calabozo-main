// app/api/admin/sessions/route.ts
import { NextResponse } from 'next/server';

const disabledResponse = () =>
  NextResponse.json(
    {
      error: 'La administración no está habilitada en esta versión',
    },
    { status: 501 }
  );

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}

export async function PUT() {
  return disabledResponse();
}

export async function DELETE() {
  return disabledResponse();
}