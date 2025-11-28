import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    // Simple query to test connection
    // We'll count profiles just to see if the DB is reachable
    // If tables don't exist yet (migration not run), this might fail with "table not found"
    // but that confirms connection is working!
    
    // However, if migration hasn't run, we might just want to return a success message 
    // or try raw query.
    
    // Let's try to query something simple.
    const count = await prisma.profile.count();

    return Response.json({
      status: 'ok',
      message: 'Connected to Neon DB via Prisma!',
      profileCount: count
    });
  } catch (error: any) {
    console.error('Database connection failed:', error);
    
    // Check for specific Prisma errors
    if (error.code === 'P1001') {
        return Response.json({ status: 'error', message: 'Can\'t reach database server', details: error.message }, { status: 500 });
    }
    if (error.code === 'P2021') {
        return Response.json({ status: 'warning', message: 'Database connected but tables missing. Run `npx prisma db push` or `migrate`.', details: error.message }, { status: 200 });
    }

    return Response.json({ status: 'error', message: 'Database connection failed', details: error.message }, { status: 500 });
  }
}
