'use client';

import { useEffect } from 'react';

export default function ZebraPrinter({ zpl, onPrintComplete, onError }) {
  useEffect(() => {
    if (!zpl) return;

    const printLabel = async () => {
      try {
        // Initialize Zebra Browser Print
        const browserPrint = new window.BrowserPrint();
        
        // Get the default printer
        const printers = await browserPrint.getLocalPrinters();
        if (!printers || printers.length === 0) {
          throw new Error('No Zebra printer found');
        }

        // Send the ZPL to the printer
        await browserPrint.send(zpl, printers[0].name);
        
        onPrintComplete?.();
      } catch (error) {
        console.error('Printing error:', error);
        onError?.(error);
      }
    };

    printLabel();
  }, [zpl, onPrintComplete, onError]);

  return null;
} 