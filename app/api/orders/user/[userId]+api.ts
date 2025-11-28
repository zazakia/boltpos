import { prisma } from '../../lib/prisma';

export async function GET(request: Request, { userId }: { userId: string }) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        user_id: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const transformedOrders = orders.map(order => ({
      ...order,
      order_items: order.items.map(item => ({
        ...item,
        products: item.product
      }))
    }));

    return Response.json({ data: transformedOrders });
  } catch (error: any) {
    console.error('API Error fetching user orders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
