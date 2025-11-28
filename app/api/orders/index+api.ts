import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    const orders = await prisma.order.findMany({
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
        },
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform the data structure to match the existing frontend expectation if necessary
    // The previous query returned `order_items` and `profiles`. 
    // Prisma returns `items` and `user`.
    // We can map it here to minimize frontend changes, or update the frontend.
    // Let's map it here for smoother transition.

    const transformedOrders = orders.map(order => ({
      ...order,
      order_items: order.items.map(item => ({
        ...item,
        products: item.product // Map `product` to `products` to match Supabase structure
      })),
      profiles: order.user // Map `user` to `profiles`
    }));

    return Response.json({ data: transformedOrders });
  } catch (error: any) {
    console.error('API Error fetching orders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // We are expecting a payload that might include items for a transactional creation
    // OR just the order details. 
    // The service usually calls `createOrderWithItems` which handles the logic.
    // Let's support creating a full order with items in one go (transactional).

    if (body.items && Array.isArray(body.items)) {
      // Transactional creation
      const { items, ...orderData } = body;

      // Calculate totals if not provided or verify them
      // For now, we assume the frontend sends valid data as per the service logic
      
      // Use $transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Order
        const order = await tx.order.create({
          data: {
            user_id: orderData.user_id,
            total: orderData.total,
            tax: orderData.tax,
            status: orderData.status,
            payment_method: orderData.payment_method,
            customer_name: orderData.customer_name,
            // ... other fields
          }
        });

        // 2. Create Order Items and Update Stock
        for (const item of items) {
          // Create Item
          await tx.orderItem.create({
            data: {
              order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity, // Recalculate or use provided
            }
          });

          // Decrement Stock
          await tx.product.update({
            where: { id: item.product_id },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }

        return order;
      });

      return Response.json({ data: result });

    } else {
      // Simple order creation (less common in this flow but good to have)
      const order = await prisma.order.create({
        data: body,
      });
      return Response.json({ data: order });
    }

  } catch (error: any) {
    console.error('API Error creating order:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
