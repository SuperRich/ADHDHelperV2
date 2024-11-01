import React, { useState } from 'react';
import { Brain, AlertCircle, HeartHandshake, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { ScheduleMoment } from './ScheduleMoment';
import { emailService } from '../services/emailService';
import { toast } from 'sonner';

interface Props {
  onSchedule: (moment: any) => void;
  desires: any[];
  isHotMode: boolean;
  isEmmaMode: boolean;
}

export function EmmaWellbeing({ onSchedule, desires, isHotMode, isEmmaMode }: Props) {
  const [weeklyIssues, setWeeklyIssues] = useState('');
  const [wellbeing, setWellbeing] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, type: 'issues' | 'wellbeing') => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const content = type === 'issues' ? weeklyIssues : wellbeing;
    const title = type === 'issues' ? 'Weekly Challenges' : 'Current Wellbeing';
    
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: enGB });
    
    const emailBody = `
${title}:

${content}

Sent on: ${currentDate}
    `.trim();

    try {
      const success = await emailService.sendEmail({
        subject: `Emma NEEDS - ${format(new Date(), 'dd/MM/yyyy', { locale: enGB })}`,
        body: emailBody,
      });
      
      if (success) {
        if (type === 'issues') {
          setWeeklyIssues('');
        } else {
          setWellbeing('');
        }
        toast.success(`${title} shared successfully!`);
      } else {
        toast.error('Failed to share. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-500" />
          Schedule a Moment
        </h2>
        
        <ScheduleMoment
          onSchedule={onSchedule}
          desires={desires}
          isHotMode={isHotMode}
          isEmmaMode={isEmmaMode}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-500" />
          Weekly Challenges
        </h2>
        
        <form onSubmit={(e) => handleSubmit(e, 'issues')} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are your 3 biggest issues for the upcoming week and how would you like Richard to help?
            </label>
            <textarea
              value={weeklyIssues}
              onChange={(e) => setWeeklyIssues(e.target.value)}
              placeholder="1. Work presentation - Need quiet time to practice...
2. Feeling overwhelmed with house chores...
3. Doctor's appointment - Could use company..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              rows={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !weeklyIssues.trim()}
            className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sharing...' : 'Share Weekly Challenges'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-purple-500" />
          Current Wellbeing
        </h2>
        
        <form onSubmit={(e) => handleSubmit(e, 'wellbeing')} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling in yourself so Richard can best support you?
            </label>
            <textarea
              value={wellbeing}
              onChange={(e) => setWellbeing(e.target.value)}
              placeholder="Share your current emotional state, energy levels, and any specific support you need..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              rows={4}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !wellbeing.trim()}
            className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sharing...' : 'Share Current Wellbeing'}
          </button>
        </form>
      </div>
    </div>
  );
}