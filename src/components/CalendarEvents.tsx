import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { googleCalendarService } from '../services/googleCalendarService';

export function CalendarEvents() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () => googleCalendarService.getUpcomingEvents(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 rounded-lg p-6">
        <p>Error loading calendar events. Please try again later.</p>
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No events scheduled this week</p>
        <p className="text-sm text-gray-400 mt-2">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-pink-500" />
          This Week's Events
        </h2>
        <span className="text-sm text-gray-500">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </span>
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900">{event.title}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {format(event.startTime, 'MMM d, h:mm a')}
              </div>
            </div>
            {event.description && (
              <p className="mt-2 text-gray-600 text-sm">{event.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 