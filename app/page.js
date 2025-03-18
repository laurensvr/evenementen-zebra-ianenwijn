'use client';

import { useState, useEffect } from 'react';
import { PrinterIcon, UserGroupIcon, BeakerIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PrinterSetup from './components/PrinterSetup';

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

  useEffect(() => {
    if (searchQuery) {
      fetch(`/api/badges?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          const filtered = attendees.filter(attendee => 
            data.some(status => status.company_number === attendee.number)
          );
          setFilteredAttendees(filtered);
        });
    } else {
      setFilteredAttendees(attendees);
    }
  }, [searchQuery, attendees]);

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
    return `^XA
^FO50,50^ADN,36,20^FD${companyName}^FS
^FO50,100^ADN,36,20^FD#${number}^FS
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

      selectedPrinter.send(zpl, function() {
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
      }, function(error) {
        alert('Error printing: ' + error);
      });

    } catch (error) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <PrinterIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Wine Event Label Printer</h1>
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
              <div className="space-y-2">
                {wines.map((wine) => (
                  <button
                    key={wine.id}
                    onClick={() => {
                      setSelectedWine(wine);
                      setModalType('wine');
                      setShowModal(true);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedWine?.id === wine.id
                        ? 'border-primary-500 bg-primary-50'
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
              <div className="space-y-4">
                {filteredAttendees.map((attendee) => {
                  const status = badgeStatus.find(s => s.company_number === attendee.number);
                  return (
                    <button
                      key={attendee.id}
                      onClick={() => {
                        setSelectedAttendee(attendee);
                        setModalType('badge');
                        setShowModal(true);
                      }}
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
                          Printed on {new Date(status.printed_at).toLocaleString()}
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
                    {record.type === 'wine' ? record.wineName : record.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.type === 'wine' 
                      ? `${record.numberOfLabels} wine labels`
                      : `${record.numberOfBadges} visitor badges`} • 
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Print {modalType === 'wine' ? 'Wine Labels' : 'Visitor Badges'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of {modalType === 'wine' ? 'Labels' : 'Badges'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
                  className="input"
                />
              </div>
              <div className="flex justify-end space-x-3">
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
        </div>
      )}
    </div>
  );
} 