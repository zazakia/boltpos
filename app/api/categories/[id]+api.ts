import { prisma } from '../../lib/prisma';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const body = await request.json();

    const category = await prisma.category.update({
      where: { id },
      data: body,
    });

    return Response.json({ data: category });
  } catch (error: any) {
    console.error('API Error updating category:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    const category = await prisma.category.delete({
      where: { id },
    });

    return Response.json({ data: category });
  } catch (error: any) {
    console.error('API Error deleting category:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
