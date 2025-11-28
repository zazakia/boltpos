import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
        return Response.json({ error: 'ids must be an array' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      }
    });

    return Response.json({ data: products });
  } catch (error: any) {
    console.error('API Error batch fetching products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
