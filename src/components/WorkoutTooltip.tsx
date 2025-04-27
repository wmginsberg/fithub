import { useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface WorkoutTooltipProps {
  workout: {
    date: string;
    name: string;
    type: string;
    moving_time: number;
    average_heartrate?: number;
    calories?: number;
  };
  position: { x: number; y: number };
  onClose: () => void;
}

export const WorkoutTooltip = ({ workout, position, onClose }: WorkoutTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div
      ref={tooltipRef}
      className="workout-tooltip"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-date">{format(new Date(workout.date), 'MMMM d, yyyy')}</span>
        <button className="tooltip-close" onClick={onClose}>×</button>
      </div>
      <div className="tooltip-content">
        <h4>{workout.name}</h4>
        <div className="tooltip-details">
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{workout.type}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{formatDuration(workout.moving_time)}</span>
          </div>
          {workout.average_heartrate && (
            <div className="detail-item">
              <span className="detail-label">Heart Rate:</span>
              <span className="detail-value">{Math.round(workout.average_heartrate)} bpm</span>
            </div>
          )}
          {workout.calories && (
            <div className="detail-item">
              <span className="detail-label">Calories:</span>
              <span className="detail-value">{Math.round(workout.calories)} cal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 