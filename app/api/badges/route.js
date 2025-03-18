import { NextResponse } from 'next/server';
import { getBadgeStatus, searchBadges, resetBadgeStatus } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (query) {
      const results = searchBadges(query);
      return NextResponse.json(results);
    }

    const badges = getBadgeStatus();
    return NextResponse.json(badges);
  } catch (error) {
    console.error('Error reading badge status:', error);
    return NextResponse.json({ error: 'Failed to read badge status' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    resetBadgeStatus();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting badge status:', error);
    return NextResponse.json({ error: 'Failed to reset badge status' }, { status: 500 });
  }
} 