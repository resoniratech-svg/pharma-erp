import { useState } from 'react';
import { Download, Filter, MapPin, Calendar, CheckCircle2, Users, Map } from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  SelectFilter,
  ActionButton,
  TableCard,
  DataTable,
  Badge,
  SummaryCard,
} from './components/shared';
import { type Column } from './components/shared';

interface MeetingLocation {
  id: string;
  eventId: string;
  eventName: string;
  location: string;
  organizer: string;
  startTime: string;
  endTime: string;
  attendees: number;
  gpsStatus: 'Verified' | 'Pending' | 'Flagged';
}

const mockData: MeetingLocation[] = [
  { id: '1', eventId: 'EVT-001', eventName: 'Q3 Regional Sales Meet', location: 'Hotel Taj, Mumbai', organizer: 'Regional Manager', startTime: '10:00 AM', endTime: '04:00 PM', attendees: 45, gpsStatus: 'Verified' },
  { id: '2', eventId: 'EVT-002', eventName: 'New Product Launch', location: 'Grand Hyatt, Delhi', organizer: 'Marketing Head', startTime: '11:00 AM', endTime: '02:00 PM', attendees: 120, gpsStatus: 'Verified' },
  { id: '3', eventId: 'EVT-003', eventName: 'Weekly Review', location: 'Branch Office, Pune', organizer: 'Area Sales Manager', startTime: '09:00 AM', endTime: '10:30 AM', attendees: 12, gpsStatus: 'Pending' },
  { id: '4', eventId: 'EVT-004', eventName: 'Distributor Conference', location: 'ITC Grand, Chennai', organizer: 'Zonal Manager', startTime: '09:30 AM', endTime: '05:30 PM', attendees: 85, gpsStatus: 'Flagged' },
];

export default function MeetingLocationTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const columns: Column<MeetingLocation>[] = [
    { key: 'eventId', label: 'Event ID', render: (row) => <span className="font-semibold text-slate-900">{row.eventId}</span> },
    { key: 'eventName', label: 'Event Name', render: (row) => <span className="font-medium text-slate-800">{row.eventName}</span> },
    { key: 'location', label: 'Location' },
    { key: 'organizer', label: 'Organizer' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'attendees', label: 'Attendees', render: (row) => <span className="font-mono text-slate-700">{row.attendees}</span> },
    {
      key: 'gpsStatus',
      label: 'GPS Status',
      render: (row) => {
        let variant: any = 'default';
        if (row.gpsStatus === 'Verified') variant = 'success';
        else if (row.gpsStatus === 'Pending') variant = 'warning';
        else if (row.gpsStatus === 'Flagged') variant = 'danger';
        return <Badge variant={variant}>{row.gpsStatus}</Badge>;
      },
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.eventName.toLowerCase().includes(search.toLowerCase()) || 
                        item.location.toLowerCase().includes(search.toLowerCase()) ||
                        item.organizer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? item.gpsStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Meeting/Event Location Tracking"
        subtitle="Track meeting locations, event attendance, participant check-ins, and GPS verification."
        actions={
          <ActionButton variant="secondary" icon={<Download className="w-4 h-4" />}>Export Data</ActionButton>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Events"
          value="24"
          subtitle="This Month"
          icon={<Calendar className="w-6 h-6" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <SummaryCard
          title="Total Meetings"
          value="182"
          subtitle="Weekly reviews & standups"
          icon={<Map className="w-6 h-6" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <SummaryCard
          title="Attendees"
          value="1,245"
          subtitle="Across all events"
          icon={<Users className="w-6 h-6" />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <SummaryCard
          title="Verified Check-Ins"
          value="98%"
          subtitle="Location matched"
          icon={<CheckCircle2 className="w-6 h-6" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search event, location, or organizer..." />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filters:</span>
            </div>
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Verified', value: 'Verified' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Flagged', value: 'Flagged' },
              ]}
              placeholder="GPS Status"
            />
          </FilterBar>

          <TableCard>
            <DataTable
              columns={columns}
              data={filteredData}
              emptyMessage="No events or meetings found."
            />
          </TableCard>
        </div>

        {/* Map Section */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Event Heat Map</h2>
          <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative min-h-[400px] flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent bg-[length:20px_20px]" />
            <Map className="w-12 h-12 text-primary mb-3 relative z-10 opacity-70" />
            <h3 className="text-md font-semibold text-slate-700 relative z-10">Attendance Heat Map</h3>
            <p className="text-sm text-slate-500 text-center px-6 mt-2 relative z-10">Visualizing event locations, meeting spots, and GPS check-in clusters.</p>
            
            {/* Demo Pins */}
            <div className="absolute top-1/4 left-1/4">
              <MapPin className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div className="absolute bottom-1/3 right-1/4">
              <MapPin className="w-6 h-6 text-rose-500" />
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 block"></span> High Density Event</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
