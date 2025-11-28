import { prisma } from '../../lib/prisma';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const body = await request.json();
    const { status } = body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return Response.json({ data: order });
  } catch (error: any) {
    console.error('API Error updating order status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
