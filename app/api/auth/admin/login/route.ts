// app/api/auth/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminLoginSchema } from '@/types/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AdminLoginSchema.parse(body);

    // Simple password check (in production use bcrypt)
    const admin = await prisma.adminUser.findUnique({
      where: { email: validated.email },
      include: { user: true },
    });

    if (!admin || admin.password !== validated.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

    return NextResponse.json(
      {
        adminId: admin.id,
        userId: admin.userId,
        email: admin.email,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { error: 'Error logging in' },
      { status: 400 }
    );
  }
}
