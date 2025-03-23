'use client';

import { useState, useEffect, useRef } from 'react';
import { PrinterIcon, UserGroupIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PrinterSetup from './components/PrinterSetup';
import PrintStats from './components/PrintStats';

export default function Home() {
  const [attendees, setAttendees] = useState([]);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [printHistory, setPrintHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [badgeStatus, setBadgeStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState([]);

  // Add ref for input field
  const badgeQuantityRef = useRef(null);

  const fetchPrintHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      // Keep all records in print history
      setPrintHistory(data);
    } catch (error) {
      console.error('Error fetching print history:', error);
    }
  };

  useEffect(() => {
    fetch('/api/attendees')
      .then(res => res.json())
      .then(data => {
        setAttendees(data);
        setFilteredAttendees(data);
      });

    fetchPrintHistory();

    fetch('/api/badges')
      .then(res => res.json())
      .then(data => setBadgeStatus(data));
  }, []);

  const sortAttendees = (attendees, badgeStatus) => {
    return [...attendees].sort((a, b) => {
      const aStatus = badgeStatus.find(s => s.company_number === a.number);
      const bStatus = badgeStatus.find(s => s.company_number === b.number);
      
      if (!!aStatus?.is_printed === !!bStatus?.is_printed) {
        return a.company.localeCompare(b.company);
      }
      
      return aStatus?.is_printed ? 1 : -1;
    });
  };

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = attendees.filter(attendee => 
        attendee.company.toLowerCase().includes(query) ||
        attendee.number.toString().includes(query)
      );
      setFilteredAttendees(sortAttendees(filtered, badgeStatus));
    } else {
      setFilteredAttendees(sortAttendees(attendees, badgeStatus));
    }
  }, [searchQuery, attendees, badgeStatus]);

  const handleResetHistory = async () => {
    if (window.confirm('Are you sure you want to clear all print history?')) {
      try {
        // Clear print history
        const historyRes = await fetch('/api/history', { method: 'DELETE' });
        if (!historyRes.ok) throw new Error('Failed to clear print history');

        // Reset badge statuses
        const badgeRes = await fetch('/api/badges', { method: 'DELETE' });
        if (!badgeRes.ok) throw new Error('Failed to reset badge statuses');

        // Update states
        setPrintHistory([]);
        setBadgeStatus([]);
        
        alert('Successfully cleared print history');
      } catch (error) {
        console.error('Error resetting history:', error);
        alert('Failed to clear print history: ' + error.message);
      }
    }
  };

  const generateVisitorBadgeZPL = (companyName, number) => {
    // Split company name into words and create a word-wrapped version
    const words = companyName.split(' ');
    let currentLine = '';
    let lines = [];
    
    words.forEach((word, index) => {
      if (currentLine === '') {
        currentLine = word;
      } else {
        // Check if adding the word would exceed 25 characters (adjusted for smaller font)
        if ((currentLine + ' ' + word).length <= 25) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      
      // Add the last line
      if (index === words.length - 1) {
        lines.push(currentLine);
      }
    });

    // Generate ZPL with word-wrapped company name and centered badge number
    // Adjusted X position to 20 (0.5cm) and using larger font sizes
    // Added 40 dots (0.5cm) padding at the top
    return `^XA
^FO20,40^A0N,36,36^FD${lines[0]}^FS
${lines.slice(1).map((line, i) => `^FO20,${80 + (i * 30)}^A0N,36,36^FD${line}^FS`).join('\n')}
^FO20,${80 + (lines.length * 30)}^A0N,84,84^FD#${number}^FS
^XZ`;
  };

  const generateEmployeeLabelZPL = (employeeName, function_) => {
    return `^XA
^FO20,40^A0N,36,36^FDIan en Wijn^FS
^FO20,120^A0N,46,46^FD${employeeName}^FS
^FO20,170^A0N,31,31^FD${function_}^FS
^XZ`;
  };

  const handlePrintEmployeeLabel = async (employeeName, function_) => {
    if (!selectedPrinter) {
      alert('Please select a printer first');
      return;
    }

    try {
      const zpl = generateEmployeeLabelZPL(employeeName, function_);
      const printData = {
        type: 'employee',
        item_name: `${employeeName}${function_ ? ` - ${function_}` : ''}`,
        quantity: 1,
        timestamp: new Date().toISOString(),
        item_id: Date.now(),
        item_number: 0,
        printer: selectedPrinter,
        zpl: zpl
      };

      console.log('Sending print request:', printData);

      // Function to handle the actual printing
      const printLabel = () => {
        return new Promise((resolve, reject) => {
          selectedPrinter.send(zpl, resolve, reject);
        });
      };

      // Print the label
      await printLabel();

      // Save to print history
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to save print history');
      }

      // Clear the input fields
      document.getElementById('employeeName').value = '';
      document.getElementById('function').value = '';

      // Refresh print history
      fetchPrintHistory();
    } catch (error) {
      console.error('Error printing employee label:', error);
      alert(`Failed to print employee label: ${error.message}`);
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      alert('Please select a printer first');
      return;
    }

    try {
      const zpl = generateVisitorBadgeZPL(selectedAttendee.company, selectedAttendee.number);
      const printData = {
        type: 'badge',
        companyName: selectedAttendee.company,
        companyNumber: selectedAttendee.number,
        numberOfBadges: numberOfPeople,
        timestamp: new Date().toISOString()
      };

      // Function to handle a single print
      const printLabel = () => {
        return new Promise((resolve, reject) => {
          selectedPrinter.send(zpl, resolve, reject);
        });
      };

      // Print multiple labels with a delay between each
      for (let i = 0; i < numberOfPeople; i++) {
        await printLabel();
        if (i < numberOfPeople - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // After all prints are done, save to history
      fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      })
      .then(res => res.json())
      .then(async (result) => {
        // Fetch both updated history and badge status
        const [historyRes, badgeRes] = await Promise.all([
          fetch('/api/history'),
          fetch('/api/badges')
        ]);
        
        const [historyData, badgeData] = await Promise.all([
          historyRes.json(),
          badgeRes.json()
        ]);

        // Update both states with fresh data
        setPrintHistory(historyData.filter(record => record.type === 'badge'));
        setBadgeStatus(badgeData);
        setShowModal(false);
      });

    } catch (error) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  const handleAttendeeClick = (attendee) => {
    setSelectedAttendee(attendee);
    setShowModal(true);
    // Focus and select all text in the badge quantity input after a short delay
    setTimeout(() => {
      badgeQuantityRef.current?.focus();
      badgeQuantityRef.current?.select();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <PrinterIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Van Riel Media</h1>
                <p className="text-lg text-gray-600">Ian en Wijn "Proef de Diepte"</p>
              </div>
            </div>
            <button
              onClick={handleResetHistory}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Reset Print History</span>
            </button>
          </div>
          
          <PrinterSetup onPrinterSelected={setSelectedPrinter} />
          
          {/* Print Statistics */}
          <PrintStats attendees={attendees} badgeStatus={badgeStatus} />
          
          {/* Employee Label Section */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Print Employee Label</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  id="employeeName"
                  className="input w-full"
                  placeholder="Enter employee name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Function (Optional)
                </label>
                <input
                  type="text"
                  id="function"
                  className="input w-full"
                  placeholder="Enter function"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  const employeeName = document.getElementById('employeeName').value;
                  const function_ = document.getElementById('function').value;
                  if (!employeeName) {
                    alert('Please enter the employee name');
                    return;
                  }
                  handlePrintEmployeeLabel(employeeName, function_);
                }}
                className="btn btn-primary"
              >
                Print Employee Label
              </button>
            </div>
          </div>

          {/* Visitor Badges Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
              <h2 className="card-title">Visitor Badges</h2>
            </div>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies..."
                className="input pl-10"
              />
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredAttendees.map((attendee) => {
                const status = badgeStatus.find(s => s.company_number === attendee.number);
                return (
                  <button
                    key={attendee.id}
                    onClick={() => handleAttendeeClick(attendee)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 ${
                      selectedAttendee?.id === attendee.id
                        ? 'border-primary-500 bg-primary-50'
                        : status?.is_printed
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{attendee.company}</div>
                    <div className="text-sm text-gray-500">Badge #: {attendee.number}</div>
                    {status?.is_printed && (
                      <div className="text-xs text-green-600 mt-1">
                        Printed on {new Date(status.printed_at).toLocaleString('nl-NL')}
                        {status.quantity > 1 && ` • ${status.quantity} badges`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Print History */}
          <div className="mt-8 card">
            <h2 className="card-title">Print History</h2>
            <div className="space-y-4">
              {printHistory.map((record, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="font-medium text-gray-900">{record.item_name}</div>
                  <div className="text-sm text-gray-500">
                    {record.type === 'badge' ? `${record.quantity} visitor badges` : 'Employee label'} • 
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Print Visitor Badge</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Badges
              </label>
              <input
                ref={badgeQuantityRef}
                type="number"
                min="1"
                value={numberOfPeople}
                onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
                className="input w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePrint();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 