import { NextResponse } from 'next/server';
import { getPrintHistory, clearPrintHistory } from '../../../lib/db';

export async function GET() {
  try {
    const history = getPrintHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error reading print history:', error);
    return NextResponse.json({ error: 'Failed to read print history' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearPrintHistory();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing print history:', error);
    return NextResponse.json({ error: 'Failed to clear print history' }, { status: 500 });
  }
} 