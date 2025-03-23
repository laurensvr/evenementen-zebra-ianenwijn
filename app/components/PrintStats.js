'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { ClipboardDocumentCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PrintStats({ attendees, badgeStatus }) {
  // Calculate statistics
  const totalAttendees = attendees.length;
  const printedAttendees = badgeStatus.filter(status => status.is_printed).length;
  const totalBadgesPrinted = badgeStatus.reduce((sum, status) => sum + (status.is_printed ? status.quantity : 0), 0);
  const totalPossibleBadges = attendees.reduce((sum, attendee) => sum + attendee.numberOfPeople, 0);
  const percentagePrinted = totalAttendees > 0 ? Math.round((printedAttendees / totalAttendees) * 100) : 0;
  const percentageBadgesPrinted = totalPossibleBadges > 0 ? Math.round((totalBadgesPrinted / totalPossibleBadges) * 100) : 0;

  // Prepare data for the companies pie chart
  const companiesChartData = {
    labels: ['Printed', 'Not Printed'],
    datasets: [
      {
        data: [printedAttendees, totalAttendees - printedAttendees],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green
          'rgba(229, 231, 235, 0.8)', // gray
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(229, 231, 235)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the badges pie chart
  const badgesChartData = {
    labels: ['Printed', 'Remaining'],
    datasets: [
      {
        data: [totalBadgesPrinted, totalPossibleBadges - totalBadgesPrinted],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(229, 231, 235, 0.8)', // gray
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(229, 231, 235)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Statistics Card */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-4">Print Statistics</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-6 w-6 text-primary-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Companies Printed</h3>
              <p className="text-2xl font-semibold text-gray-900">{printedAttendees}</p>
              <p className="text-sm text-gray-500">of {totalAttendees} ({percentagePrinted}%)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-primary-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Badges</h3>
              <p className="text-2xl font-semibold text-gray-900">{totalBadgesPrinted}</p>
              <p className="text-sm text-gray-500">of {totalPossibleBadges} ({percentageBadgesPrinted}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold text-center mb-4">Companies Status</h3>
        <div className="h-[200px]">
          <Pie options={chartOptions} data={companiesChartData} />
        </div>
      </div>
      <div className="card p-4">
        <h3 className="text-lg font-semibold text-center mb-4">Badges Status</h3>
        <div className="h-[200px]">
          <Pie options={chartOptions} data={badgesChartData} />
        </div>
      </div>
    </div>
  );
} 