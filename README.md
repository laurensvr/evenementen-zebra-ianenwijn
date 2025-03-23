# Visitor Badge Printer Application

A React-based web application for printing visitor badges using Zebra printers. This application allows event organizers to manage and print visitor badges efficiently with real-time tracking of printed badges.

## Features

- **Printer Setup**: Connect to local Zebra printers using the browser's USB API
- **Visitor Management**: View and search through the list of visitors/companies
- **Badge Printing**: Print individual or multiple badges for each visitor
- **Print History**: Track all printed badges with timestamps
- **Status Tracking**: Visual indication of printed vs unprinted badges
- **Search Functionality**: Quick search through companies by name or badge number

## Technical Details

### Components

1. **PrinterSetup**: Handles USB printer connection and selection
2. **Main Application**: Manages the visitor list, printing operations, and UI state

### Data Flow

1. The application loads three types of data on startup:
   - List of attendees from `/api/attendees`
   - Print history from `/api/history`
   - Badge status from `/api/badges`

2. When a badge is printed:
   - Generates ZPL code for the badge
   - Sends to printer via USB connection
   - Updates print history and badge status via API
   - Refreshes the UI to reflect changes

### ZPL Printing Specifications

The badge layout uses the following specifications:
- Starting position: 0.5cm from left edge (20 dots)
- Company name: 28-point font
- Badge number: 32-point font
- Automatic word wrapping for long company names
- Multiple badge printing with 500ms delay between prints

### API Endpoints

- `GET /api/attendees`: Retrieves list of attendees
- `GET /api/history`: Retrieves print history
- `GET /api/badges`: Retrieves badge status
- `POST /api/print`: Records new print jobs
- `DELETE /api/badges`: Resets all badge statuses

### Search and Sorting

- Real-time search filtering for companies
- Automatic sorting:
  1. Unprinted badges first
  2. Alphabetical by company name within each group (printed/unprinted)

## Usage

1. Connect a Zebra printer via USB
2. Select the printer from the setup panel
3. Search or scroll through the visitor list
4. Click on a visitor to open the print dialog
5. Enter the number of badges needed
6. Click print or press Enter

## Reset Functionality

The "Reset Badges" button allows administrators to:
- Clear all badge printing history
- Reset the printed status of all badges
- Start fresh for a new event or day

## Error Handling

- Printer connection validation
- Print job error catching and user notification
- API error handling with user feedback

## Browser Compatibility

Requires a modern browser with USB API support for printer connection.

## Prerequisites

- Node.js 18 or later
- Zebra ZD410 printer
- Zebra Browser Print installed on the client machine

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `data` directory in the project root and add the following CSV files:
   - `wines.csv`:
     ```csv
     name,number
     "Wine Name 1",1
     "Wine Name 2",2
     ```
   - `attendees.csv`:
     ```csv
     company,numberOfPeople
     "Company Name 1",2
     "Company Name 2",3
     ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Start the production server:
   ```bash
   npm start
   ```

## Usage

1. Access the application at `http://localhost:3000` (or your configured domain)
2. Select a wine from the list
3. Click "Print Labels"
4. Enter the number of people
5. Confirm to print

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the following directories to your web server:
   - `.next/`
   - `public/`
   - `data/`
   - `package.json`
   - `next.config.js`

3. Install production dependencies:
   ```bash
   npm install --production
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Data Structure

### wines.csv
```csv
name,number
"Wine Name 1",1
"Wine Name 2",2
```

### attendees.csv
```csv
company,numberOfPeople
"Company Name 1",2
"Company Name 2",3
```

### print_history.json
```json
[
  {
    "wineName": "Wine Name 1",
    "wineNumber": "1",
    "numberOfPeople": 2,
    "timestamp": "2024-03-18T12:00:00.000Z"
  }
]
```

## Troubleshooting

1. If the printer is not detected:
   - Ensure Zebra Browser Print is installed
   - Check if the printer is connected and powered on
   - Try refreshing the page

2. If labels are not printing:
   - Check the browser console for errors
   - Verify the ZPL code is correct
   - Ensure the printer is properly configured

## License

MIT 