import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return Response.json({ data: categories });
  } catch (error: any) {
    console.error('API Error fetching categories:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const category = await prisma.category.create({
      data: {
        name: body.name,
        color: body.color,
      },
    });

    return Response.json({ data: category });
  } catch (error: any) {
    console.error('API Error creating category:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
