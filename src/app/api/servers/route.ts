import { NextResponse } from 'next/server';
import { getServers, upsertServer } from '@/lib/db';
import { Server } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const servers = getServers();
        return NextResponse.json(servers);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const servers: Server[] = await request.json();
        for (const server of servers) {
            upsertServer(server);
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save servers' }, { status: 500 });
    }
}
