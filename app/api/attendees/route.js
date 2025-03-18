import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const attendeesPath = path.join(process.cwd(), 'data', 'attendees.csv');
    const fileContent = fs.readFileSync(attendeesPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const attendees = records.map((record, index) => ({
      id: index + 1,
      company: record.company,
      numberOfPeople: parseInt(record.numberOfPeople),
      number: parseInt(record.number)
    }));

    return NextResponse.json(attendees);
  } catch (error) {
    console.error('Error reading attendees:', error);
    return NextResponse.json({ error: 'Failed to read attendees data' }, { status: 500 });
  }
} 