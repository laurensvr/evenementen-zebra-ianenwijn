'use client';

import { useState, useEffect } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';

export default function PrinterSetup({ onPrinterSelected }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get the default printer first
    BrowserPrint.getDefaultDevice("printer", function(device) {
      if (device) {
        setSelectedDevice(device);
        setDevices([device]);
        onPrinterSelected(device);
      }
    }, function(error) {
      setError(error);
    });

    // Then discover other devices
    BrowserPrint.getLocalDevices(function(deviceList) {
      if (deviceList) {
        setDevices(prevDevices => {
          const newDevices = [...prevDevices];
          deviceList.forEach(device => {
            if (!newDevices.find(d => d.uid === device.uid)) {
              newDevices.push(device);
            }
          });
          return newDevices;
        });
      }
    }, function(error) {
      setError(error);
    }, "printer");
  }, [onPrinterSelected]);

  const handleDeviceChange = (event) => {
    const device = devices.find(d => d.uid === event.target.value);
    if (device) {
      setSelectedDevice(device);
      onPrinterSelected(device);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex items-center space-x-2">
          <PrinterIcon className="h-5 w-5 text-red-400" />
          <p className="text-red-700">Error initializing printer: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <PrinterIcon className="h-6 w-6 text-primary-600" />
        <h2 className="card-title">Printer Setup</h2>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Printer
        </label>
        <select
          value={selectedDevice?.uid || ''}
          onChange={handleDeviceChange}
          className="input"
        >
          {devices.map((device) => (
            <option key={device.uid} value={device.uid}>
              {device.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 