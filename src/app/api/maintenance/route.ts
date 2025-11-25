import { NextResponse } from 'next/server';
import { getMaintenanceWindows, saveMaintenanceWindows } from '@/lib/db';
import { MaintenanceWindow } from '@/lib/types';

export async function GET() {
    try {
        const windows = getMaintenanceWindows();
        return NextResponse.json(windows);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch maintenance windows' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const windows: MaintenanceWindow[] = await request.json();
        saveMaintenanceWindows(windows);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save maintenance windows' }, { status: 500 });
    }
}
