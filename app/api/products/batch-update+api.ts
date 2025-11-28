import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || !['activate', 'deactivate'].includes(action)) {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const active = action === 'activate';

    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        active,
      },
    });

    return Response.json({ data: result });
  } catch (error: any) {
    console.error('API Error batch updating products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
