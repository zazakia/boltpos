import { prisma } from '../../lib/prisma';

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ data: product });
  } catch (error: any) {
    console.error('API Error fetching product:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const body = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data: body,
    });

    return Response.json({ data: product });
  } catch (error: any) {
    console.error('API Error updating product:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    // Soft delete as per original service
    const product = await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    return Response.json({ data: product });
  } catch (error: any) {
    console.error('API Error deleting product:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
