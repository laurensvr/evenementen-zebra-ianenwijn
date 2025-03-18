import { NextResponse } from 'next/server';
import { getPrintHistory } from '../../../lib/db';

export async function GET() {
  try {
    const history = getPrintHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error reading print history:', error);
    return NextResponse.json({ error: 'Failed to read print history' }, { status: 500 });
  }
} 