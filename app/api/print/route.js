import { NextResponse } from 'next/server';
import { addPrintHistory } from '../../../lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received print request:', data);
    
    const { type, wineId, wineName, wineNumber, companyName, companyNumber, numberOfLabels, numberOfBadges, item_name, item_id, item_number, quantity, printer, zpl } = data;

    if (!printer || !zpl) {
      console.error('Missing required fields:', { printer, zpl });
      return NextResponse.json({ error: 'Missing required fields: printer and zpl' }, { status: 400 });
    }

    if (type === 'employee') {
      console.log('Processing employee label:', { item_id, item_name, item_number, quantity });
      // For employee labels, use the provided item_id and item_number
      addPrintHistory(
        type,
        item_id,
        item_name,
        item_number,
        quantity
      );
    } else {
      // For wine and badge labels, use the existing logic
      addPrintHistory(
        type,
        type === 'wine' ? wineId : companyNumber,
        type === 'wine' ? wineName : companyName,
        type === 'wine' ? wineNumber : companyNumber,
        type === 'wine' ? numberOfLabels : numberOfBadges
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving print history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      data: data
    });
    return NextResponse.json({ 
      error: 'Failed to save print history',
      details: error.message 
    }, { status: 500 });
  }
} 