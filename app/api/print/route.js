import { NextResponse } from 'next/server';
import { addPrintHistory } from '../../../lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const { type, wineId, wineName, wineNumber, companyName, companyNumber, numberOfLabels, numberOfBadges } = data;

    addPrintHistory(
      type,
      type === 'wine' ? wineId : companyNumber,
      type === 'wine' ? wineName : companyName,
      type === 'wine' ? wineNumber : companyNumber,
      type === 'wine' ? numberOfLabels : numberOfBadges
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving print history:', error);
    return NextResponse.json({ error: 'Failed to save print history' }, { status: 500 });
  }
} 