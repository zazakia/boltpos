import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    const where = activeOnly ? { active: true } : {};

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Normalize data to match the previous Supabase structure if needed,
    // or we can adapt the frontend.
    // The previous service normalized `categories` (array) to `category` (object).
    // Prisma `include: { category: true }` returns a single object `category`, which matches the goal.
    
    return Response.json({ data: products });
  } catch (error: any) {
    console.error('API Error fetching products:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation could go here
    
    const product = await prisma.product.create({
      data: {
        name: body.name,
        price: body.price,
        category_id: body.category_id, // Prisma uses the foreign key field directly
        image_url: body.image_url,
        stock: body.stock,
        active: body.active ?? true,
        description: body.description,
        base_uom: body.base_uom,
        min_stock_level: body.min_stock_level,
        shelf_life: body.shelf_life
      },
    });

    return Response.json({ data: product });
  } catch (error: any) {
    console.error('API Error creating product:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
