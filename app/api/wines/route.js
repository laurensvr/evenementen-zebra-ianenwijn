import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const winesPath = path.join(process.cwd(), 'data', 'wines.csv');
    const fileContent = fs.readFileSync(winesPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const wines = records.map((record, index) => ({
      id: index + 1,
      name: record.name,
      number: record.number
    }));

    return NextResponse.json(wines);
  } catch (error) {
    console.error('Error reading wines:', error);
    return NextResponse.json({ error: 'Failed to read wines data' }, { status: 500 });
  }
} 