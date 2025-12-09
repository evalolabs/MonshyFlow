/**
 * ScheduleConfigForm Component
 * 
 * Configuration form for scheduled workflows with timezone support
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
  enabled: boolean;
}

interface ScheduleConfigFormProps {
  workflowId: string;
  initialConfig?: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
}

interface CronPreview {
  valid: boolean;
  error?: string;
  nextRunAt?: string;
  preview?: string[];
}

type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'hourly' | 'custom';

export function ScheduleConfigForm({
  workflowId: _workflowId,
  initialConfig,
  onConfigChange,
}: ScheduleConfigFormProps) {
  // Parse initial cron expression to determine if we should use advanced mode
  const parseInitialCron = (cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return { useAdvanced: true };
    
    const [min, hour, day, month, weekday] = parts;
    
    // Check if it's a simple pattern we can represent in easy mode
    if (month === '*' && day === '*') {
      if (weekday === '*') {
        if (hour === '*') {
          // Every hour: "X * * * *"
          return { useAdvanced: false, frequency: 'hourly' as ScheduleFrequency, time: `00:${min.padStart(2, '0')}` };
        } else {
          // Daily: "X Y * * *"
          return { useAdvanced: false, frequency: 'daily' as ScheduleFrequency, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` };
        }
      } else if (weekday !== '*' && hour !== '*' && min !== '*') {
        // Weekly: "X Y * * Z"
        return { useAdvanced: false, frequency: 'weekly' as ScheduleFrequency, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`, dayOfWeek: weekday };
      }
    } else if (month === '*' && day !== '*' && weekday === '*' && hour !== '*' && min !== '*') {
      // Monthly: "X Y Z * *"
      return { useAdvanced: false, frequency: 'monthly' as ScheduleFrequency, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`, dayOfMonth: day };
    }
    
    return { useAdvanced: true };
  };

  const initialCron = initialConfig?.cronExpression || '0 9 * * *';
  const parsed = parseInitialCron(initialCron);
  
  const [cronExpression, setCronExpression] = useState(initialCron);
  const [timezone, setTimezone] = useState(initialConfig?.timezone || 'UTC');
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? true);
  const [timezones, setTimezones] = useState<Array<{ id: string; displayName: string; offset: string }>>([]);
  const [preview, setPreview] = useState<CronPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [useAdvancedMode, setUseAdvancedMode] = useState(parsed.useAdvanced);
  
  // Easy mode settings
  const [frequency, setFrequency] = useState<ScheduleFrequency>(parsed.frequency || 'daily');
  const [time, setTime] = useState(parsed.time || '09:00');
  const [dayOfWeek, setDayOfWeek] = useState(parsed.dayOfWeek || '1'); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(parsed.dayOfMonth || '1');
  
  const [commonCronExpressions] = useState([
    { label: 'Every minute', value: '* * * * *', frequency: 'hourly' as ScheduleFrequency },
    { label: 'Every hour', value: '0 * * * *', frequency: 'hourly' as ScheduleFrequency },
    { label: 'Every day at 9 AM', value: '0 9 * * *', frequency: 'daily' as ScheduleFrequency },
    { label: 'Every day at midnight', value: '0 0 * * *', frequency: 'daily' as ScheduleFrequency },
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1', frequency: 'weekly' as ScheduleFrequency },
    { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5', frequency: 'weekly' as ScheduleFrequency },
    { label: 'Every month on 1st at 9 AM', value: '0 9 1 * *', frequency: 'monthly' as ScheduleFrequency },
    { label: 'Every Sunday at midnight', value: '0 0 * * 0', frequency: 'weekly' as ScheduleFrequency },
  ]);

  // Load timezones on mount
  useEffect(() => {
    loadTimezones();
  }, []);

  // Validate cron expression when it changes (with delay to avoid race conditions)
  useEffect(() => {
    // Skip validation if we're in easy mode and time is not set yet
    if (!useAdvancedMode && (!time || !time.includes(':'))) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (cronExpression && cronExpression.trim()) {
        validateCronExpression();
      }
    }, 800); // Increased delay to ensure cron is generated first

    return () => clearTimeout(timeoutId);
  }, [cronExpression, timezone, useAdvancedMode, time]);

  // Convert easy mode settings to cron expression
  const generateCronFromEasyMode = (): string => {
    if (!time || !time.includes(':')) {
      return '0 9 * * *'; // Default fallback
    }
    
    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return '0 9 * * *'; // Default fallback
    }
    
    switch (frequency) {
      case 'hourly':
        return `${minutes} * * * *`;
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      case 'monthly':
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      default:
        return cronExpression;
    }
  };

  // Update cron expression when easy mode settings change
  useEffect(() => {
    if (!useAdvancedMode && time && time.includes(':')) {
      const newCron = generateCronFromEasyMode();
      if (newCron && newCron !== cronExpression) {
        setCronExpression(newCron);
      }
    }
  }, [frequency, time, dayOfWeek, dayOfMonth, useAdvancedMode]);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange({
      cronExpression,
      timezone,
      enabled,
    });
  }, [cronExpression, timezone, enabled]);

  const loadTimezones = async () => {
    try {
      const response = await api.get('/api/scheduler/timezones');
      const data = response.data;
      
      // Combine system and IANA timezones, removing duplicates by id
      const systemTz = (data.systemTimezones || []).map((tz: any) => ({ ...tz, source: 'system' }));
      const ianaTz = (data.ianaTimezones || []).map((tz: any) => ({ ...tz, source: 'iana' }));
      
      // Create a map to deduplicate by id (prefer IANA over system if duplicate)
      const timezoneMap = new Map<string, any>();
      
      // First add system timezones
      systemTz.forEach((tz: any) => {
        if (!timezoneMap.has(tz.id)) {
          timezoneMap.set(tz.id, tz);
        }
      });
      
      // Then add/override with IANA timezones (they take precedence)
      ianaTz.forEach((tz: any) => {
        timezoneMap.set(tz.id, tz);
      });
      
      // Convert map back to array and sort by offset
      const allTimezones = Array.from(timezoneMap.values()).sort((a, b) => {
        // Sort by offset (UTC offset comparison)
        return a.offset.localeCompare(b.offset);
      });

      setTimezones(allTimezones);
    } catch (error) {
      console.error('Error loading timezones:', error);
      // Fallback to common timezones
      setTimezones([
        { id: 'UTC', displayName: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
        { id: 'Europe/Berlin', displayName: 'Europe/Berlin (CET/CEST)', offset: '+01:00' },
        { id: 'America/New_York', displayName: 'America/New_York (EST/EDT)', offset: '-05:00' },
        { id: 'Asia/Tokyo', displayName: 'Asia/Tokyo (JST)', offset: '+09:00' },
      ]);
    }
  };

  const validateCronExpression = async () => {
    if (!cronExpression.trim()) {
      setPreview({ valid: false, error: 'Cron expression is required' });
      return;
    }

    // Basic validation before API call
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      setPreview({ valid: false, error: 'Invalid cron format. Expected 5 parts (minute hour day month weekday)' });
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.post('/api/scheduler/validate-cron', {
        cronExpression: cronExpression.trim(),
        timezone: timezone || 'UTC',
      });

      if (response.data) {
        setPreview(response.data);
      } else {
        setPreview({ valid: false, error: 'Invalid response from server' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Failed to validate cron expression. Please check your connection.';
      
      setPreview({
        valid: false,
        error: errorMessage,
      });
      
      console.error('Cron validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Schedule Enabled
        </label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {enabled ? 'Schedule is active' : 'Schedule is disabled'}
          </span>
        </div>
      </div>

      {/* Schedule Configuration - Easy Mode */}
      {!useAdvancedMode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How often should this run? *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hourly">Every hour</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>

          {frequency !== 'hourly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of week *
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of month (1-31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => setUseAdvancedMode(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Advanced: Use cron expression
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Cron Expression *
            </label>
            <button
              type="button"
              onClick={() => setUseAdvancedMode(false)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Use simple mode
            </button>
          </div>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="0 9 * * *"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
              preview && !preview.valid
                ? 'border-red-300 bg-red-50'
                : preview?.valid
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300'
            }`}
          />
          <div className="text-xs text-gray-500">
            Format: <code className="bg-gray-100 px-1 rounded">minute hour day month weekday</code>
            <br />
            Example: <code className="bg-gray-100 px-1 rounded">0 9 * * *</code> = Every day at 9:00 AM
          </div>

          {/* Common Cron Expressions */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quick Select:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setCronExpression(e.target.value);
                }
              }}
              value=""
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a common schedule...</option>
              {commonCronExpressions.map((expr) => (
                <option key={expr.value} value={expr.value}>
                  {expr.label} ({expr.value})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone *
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timezones.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.displayName} (UTC{tz.offset})
            </option>
          ))}
        </select>
        <div className="mt-1 text-xs text-gray-500">
          Select the timezone for schedule execution. This is critical for accurate timing across different regions.
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className={`p-3 rounded-md border ${
          preview.valid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {isValidating ? (
            <div className="text-sm text-gray-600">Validating...</div>
          ) : preview.valid ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm font-medium text-green-800">
                  Valid cron expression
                </span>
              </div>
              {preview.nextRunAt && (
                <div className="text-sm text-green-700">
                  <strong>Next run:</strong> {new Date(preview.nextRunAt).toLocaleString('en-US', {
                    timeZone: timezone,
                    dateStyle: 'full',
                    timeStyle: 'long',
                  })} ({timezone})
                </div>
              )}
              {preview.preview && preview.preview.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-green-800 mb-1">
                    Upcoming runs:
                  </div>
                  <ul className="text-xs text-green-700 space-y-1">
                    {preview.preview.slice(0, 5).map((dateStr, index) => (
                      <li key={index}>
                        {new Date(dateStr).toLocaleString('en-US', {
                          timeZone: timezone,
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-red-600">❌</span>
              <span className="text-sm text-red-800">
                {preview.error || 'Invalid cron expression'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

