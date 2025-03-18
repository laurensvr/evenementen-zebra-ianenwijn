# Wine Label Printer

A web application for printing wine labels during tasting events using a Zebra ZD410 printer.

## Features

- Print wine labels with centered numbers
- Track print history
- Monitor attendance
- Modern, responsive UI with Tailwind CSS
- Integration with Zebra Browser Print

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