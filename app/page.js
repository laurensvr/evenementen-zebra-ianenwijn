'use client';

import { useState, useEffect, useRef } from 'react';
import { PrinterIcon, UserGroupIcon, BeakerIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PrinterSetup from './components/PrinterSetup';
import parseRangeInput from './utils/rangeParser';

export default function Home() {
  const [wines, setWines] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedWine, setSelectedWine] = useState(null);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [printHistory, setPrintHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [badgeStatus, setBadgeStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttendees, setFilteredAttendees] = useState([]);
  const [wineSearchQuery, setWineSearchQuery] = useState('');
  const [wineRangeInput, setWineRangeInput] = useState('');
  const [selectedWines, setSelectedWines] = useState([]);
  const [filteredWines, setFilteredWines] = useState([]);

  // Add refs for input fields
  const badgeQuantityRef = useRef(null);
  const wineQuantityRef = useRef(null);

  useEffect(() => {
    fetch('/api/wines')
      .then(res => res.json())
      .then(data => setWines(data));

    fetch('/api/attendees')
      .then(res => res.json())
      .then(data => {
        setAttendees(data);
        setFilteredAttendees(data);
      });

    fetch('/api/history')
      .then(res => res.json())
      .then(data => setPrintHistory(data));

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

  const handleResetBadges = async () => {
    if (window.confirm('Are you sure you want to reset all badge statuses?')) {
      try {
        await fetch('/api/badges', { method: 'DELETE' });
        setBadgeStatus([]);
        setPrintHistory(prev => prev.filter(record => record.type !== 'badge'));
      } catch (error) {
        console.error('Error resetting badges:', error);
        alert('Failed to reset badge statuses');
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
        // Check if adding the word would exceed 20 characters (approximate width)
        if ((currentLine + ' ' + word).length <= 20) {
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
    return `^XA
^FO50,30^ADN,36,20^FD${lines[0]}^FS
${lines.slice(1).map((line, i) => `^FO50,${60 + (i * 40)}^ADN,36,20^FD${line}^FS`).join('\n')}
^FO50,${60 + (lines.length * 40)}^ADN,48,24^FD#${number}^FS
^XZ`;
  };

  const generateWineLabelZPL = (number, name) => {
    return `^XA
^FO50,50^ADN,36,20^FD#${number}^FS
^FO50,100^ADN,24,16^FD${name}^FS
^XZ`;
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      alert('Please select a printer first');
      return;
    }

    try {
      let zpl;
      let printData;

      if (modalType === 'wine' && selectedWine) {
        zpl = generateWineLabelZPL(selectedWine.number, selectedWine.name);
        printData = {
          type: 'wine',
          wineId: selectedWine.id,
          wineName: selectedWine.name,
          wineNumber: selectedWine.number,
          numberOfLabels: numberOfPeople,
          timestamp: new Date().toISOString()
        };
      } else if (modalType === 'badge' && selectedAttendee) {
        zpl = generateVisitorBadgeZPL(selectedAttendee.company, selectedAttendee.number);
        printData = {
          type: 'badge',
          companyName: selectedAttendee.company,
          companyNumber: selectedAttendee.number,
          numberOfBadges: numberOfPeople,
          timestamp: new Date().toISOString()
        };
      }

      // Function to handle a single print
      const printLabel = () => {
        return new Promise((resolve, reject) => {
          selectedPrinter.send(zpl, resolve, reject);
        });
      };

      // Print multiple labels with a delay between each
      for (let i = 0; i < numberOfPeople; i++) {
        await printLabel();
        // Add a small delay between prints to prevent printer buffer issues
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
      .then(result => {
        setPrintHistory(prev => [...prev, result]);
        if (modalType === 'badge') {
          fetch('/api/badges')
            .then(res => res.json())
            .then(data => setBadgeStatus(data));
        }
        setShowModal(false);
      });

    } catch (error) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  useEffect(() => {
    if (wineSearchQuery) {
      const filtered = wines.filter(wine => 
        wine.name.toLowerCase().includes(wineSearchQuery.toLowerCase()) ||
        wine.number.toString().includes(wineSearchQuery)
      );
      setFilteredWines(filtered);
    } else {
      setFilteredWines(wines);
    }
  }, [wineSearchQuery, wines]);

  const handleWineRangeInput = (e) => {
    const input = e.target.value;
    setWineRangeInput(input);
    
    if (input.trim()) {
      const numbers = parseRangeInput(input);
      const selected = wines.filter(wine => numbers.includes(parseInt(wine.number)));
      setSelectedWines(selected);
    } else {
      setSelectedWines([]);
    }
  };

  const handleBulkWinePrint = async () => {
    if (!selectedPrinter) {
      alert('Please select a printer first');
      return;
    }

    if (selectedWines.length === 0) {
      alert('Please select at least one wine to print');
      return;
    }

    try {
      for (const wine of selectedWines) {
        const zpl = generateWineLabelZPL(wine.number, wine.name);
        
        const printLabel = () => {
          return new Promise((resolve, reject) => {
            selectedPrinter.send(zpl, resolve, reject);
          });
        };

        await printLabel();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const printData = {
        type: 'wine',
        wineId: selectedWines[0].id,
        wineName: selectedWines.map(w => w.name).join(', '),
        wineNumber: selectedWines.map(w => w.number).join(', '),
        numberOfLabels: selectedWines.length,
        timestamp: new Date().toISOString()
      };

      fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      })
      .then(res => res.json())
      .then(result => {
        setPrintHistory(prev => [...prev, result]);
        setWineRangeInput('');
        setSelectedWines([]);
      });

    } catch (error) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  const handleAttendeeClick = (attendee) => {
    setSelectedAttendee(attendee);
    setModalType('badge');
    setShowModal(true);
    // Focus and select all text in the badge quantity input after a short delay
    setTimeout(() => {
      badgeQuantityRef.current?.focus();
      badgeQuantityRef.current?.select();
    }, 100);
  };

  const handleWineClick = (wine) => {
    setSelectedWine(wine);
    setModalType('wine');
    setShowModal(true);
    // Focus and select all text in the wine quantity input after a short delay
    setTimeout(() => {
      wineQuantityRef.current?.focus();
      wineQuantityRef.current?.select();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <PrinterIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Ian en Wijn Label Printer</h1>
            </div>
            <button
              onClick={handleResetBadges}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>Reset Badges</span>
            </button>
          </div>
          
          <PrinterSetup onPrinterSelected={setSelectedPrinter} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wine Labels Section */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BeakerIcon className="h-6 w-6 text-primary-600" />
                <h2 className="card-title">Wine Labels</h2>
              </div>
              
              <div className="mb-6">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={wineSearchQuery}
                    onChange={(e) => setWineSearchQuery(e.target.value)}
                    placeholder="Search wines..."
                    className="input pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={wineRangeInput}
                    onChange={handleWineRangeInput}
                    placeholder="Enter wine numbers (e.g., 1-100, 12-14, 1,4,5,6,7)"
                    className="input flex-1"
                  />
                  <button
                    onClick={handleBulkWinePrint}
                    disabled={selectedWines.length === 0}
                    className="btn btn-primary"
                  >
                    Print Selected
                  </button>
                </div>
                {selectedWines.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Selected wines: {selectedWines.map(w => w.name).join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredWines.map((wine) => (
                  <button
                    key={wine.id}
                    onClick={() => handleWineClick(wine)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedWine?.id === wine.id
                        ? 'border-primary-500 bg-primary-50'
                        : selectedWines.some(w => w.id === wine.id)
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm text-gray-900">{wine.name}</div>
                    <div className="text-xs text-gray-500">#{wine.number}</div>
                  </button>
                ))}
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
          </div>

          {/* Print History */}
          <div className="mt-8 card">
            <h2 className="card-title">Print History</h2>
            <div className="space-y-4">
              {printHistory.map((record, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="font-medium text-gray-900">
                    {record.type === 'wine' ? record.item_name : record.item_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.type === 'wine' 
                      ? `${record.quantity} wine labels`
                      : `${record.quantity} visitor badges`} • 
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
            <h3 className="text-lg font-semibold mb-4">
              {modalType === 'badge' ? 'Print Visitor Badge' : 'Print Wine Label'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalType === 'badge' ? 'Number of Badges' : 'Number of Labels'}
              </label>
              <input
                ref={modalType === 'badge' ? badgeQuantityRef : wineQuantityRef}
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