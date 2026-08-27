// app/api/auth/admin/login/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'El acceso de administrador no está habilitado en esta versión',
    },
    { status: 501 }
  );
}
