import { useEffect, useState } from 'react';
import { 
  format, 
  startOfYear,
  endOfYear, 
  startOfWeek,
  addDays,
  isFuture,
  min,
  differenceInWeeks,
  parseISO
} from 'date-fns';
import axios from 'axios';
import { WorkoutTooltip } from './WorkoutTooltip';

interface WorkoutBase {
  id: number;
  date: string;
  type: string;
  name: string;
  moving_time: number;
  average_heartrate?: number;
  calories?: number;
}

interface Workout extends WorkoutBase {
  intensity: number;
}

interface WorkoutGridProps {
  accessToken: string;
}

interface TooltipState {
  workout: Workout | null;
  position: { x: number; y: number };
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const calculateIntensity = (workout: WorkoutBase): number => {
  const timeScore = Math.min(workout.moving_time / (60 * 60), 1);
  const heartRateScore = workout.average_heartrate ? (workout.average_heartrate - 100) / 100 : 0.5;
  const calorieScore = workout.calories ? Math.min(workout.calories / 1000, 1) : 0.5;
  return (timeScore * 0.3 + heartRateScore * 0.4 + calorieScore * 0.3);
};

export const WorkoutGrid = ({ accessToken }: WorkoutGridProps) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState<TooltipState>({ workout: null, position: { x: 0, y: 0 } });

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => 
    new Date().getFullYear() - i
  );

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        console.log('Fetching workouts for year:', selectedYear);
        console.log('Using access token:', accessToken ? 'Present' : 'Missing');

        if (!accessToken) {
          console.error('No access token available');
          return;
        }

        const startDate = startOfYear(new Date(selectedYear, 0, 1));
        const endDate = min([endOfYear(startDate), new Date()]);

        console.log('Fetching workouts between:', format(startDate, 'yyyy-MM-dd'), 'and', format(endDate, 'yyyy-MM-dd'));

        const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            after: Math.floor(startDate.getTime() / 1000),
            before: Math.floor(endDate.getTime() / 1000),
            per_page: 200,
          },
        });

        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response format:', response.data);
          return;
        }

        const processedWorkouts = response.data
          .map((activity: any) => ({
            id: activity.id,
            date: activity.start_date,
            type: activity.type,
            name: activity.name,
            moving_time: activity.moving_time,
            average_heartrate: activity.average_heartrate,
            calories: activity.calories,
          }))
          .sort((a: WorkoutBase, b: WorkoutBase) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((workout: WorkoutBase) => ({
            ...workout,
            intensity: calculateIntensity(workout)
          }));

        console.log('Processed workouts:', processedWorkouts.length);
        console.log('Sample dates (sorted):', processedWorkouts.slice(0, 3).map((w: WorkoutBase) => w.date));
        console.log('First date:', processedWorkouts[0]?.date);
        console.log('Last date:', processedWorkouts[processedWorkouts.length - 1]?.date);

        setWorkouts(processedWorkouts);
      } catch (error: any) {
        console.error('Error fetching workouts:', error?.response?.data || error?.message || error);
        if (error?.response?.status === 401) {
          console.error('Authentication error - token may be expired');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [accessToken, selectedYear]);

  const getIntensityColor = (intensity: number) => {
    const colors = [
      '#ebedf0',
      '#9be9a8',
      '#40c463',
      '#30a14e',
      '#216e39'
    ];
    
    if (!intensity) return colors[0];
    const index = Math.max(1, Math.min(4, Math.ceil(intensity * 4)));
    return colors[index];
  };

  const generateGridData = () => {
    // Start from January 1st of the selected year
    const yearStart = new Date(selectedYear, 0, 1);
    
    // Find the first Sunday before or on January 1st
    const firstDisplayDate = new Date(yearStart);
    while (firstDisplayDate.getDay() !== 0) {  // 0 = Sunday
      firstDisplayDate.setDate(firstDisplayDate.getDate() - 1);
    }
    
    // Create empty 7x53 grid
    const grid: (Date | null)[][] = Array(7).fill(null).map(() => Array(53).fill(null));
    
    // Fill the grid day by day
    let currentDate = new Date(firstDisplayDate);
    let currentWeek = 0;
    
    while (currentWeek < 53) {
      const dayOfWeek = currentDate.getDay();  // 0-6 (Sun-Sat)
      
      // Only add the date if it's not in the future
      if (!isFuture(currentDate)) {
        grid[dayOfWeek][currentWeek] = new Date(currentDate);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // If we've reached a Sunday, move to next week
      if (currentDate.getDay() === 0) {
        currentWeek++;
      }
    }
    
    return grid;
  };

  if (loading) {
    return <div>Loading workouts...</div>;
  }

  const gridData = generateGridData();

  return (
    <div className="workout-grid">
      <div className="workout-content">
        <h3 className="workout-summary">
          <span className="workout-count">{workouts.length}</span> workouts in {selectedYear}
        </h3>
        <div className="main-content">
          <div className="grid-section">
            <div className="month-labels">
              {MONTHS.map(month => (
                <span key={month}>{month}</span>
              ))}
            </div>
            <div className="grid-wrapper">
              <div className="day-labels">
                {DAYS_OF_WEEK.map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="grid-container">
                {/* Create columns first, then rows to match GitHub's structure */}
                {Array.from({ length: 53 }).map((_, colIndex) => (
                  <div key={`col-${colIndex}`} className="grid-column">
                    {Array.from({ length: 7 }).map((_, rowIndex) => {
                      const date = gridData[rowIndex][colIndex];
                      
                      if (!date) return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="grid-cell"
                          style={{ backgroundColor: '#ebedf0' }}
                        />
                      );
                      
                      const cellDateStr = format(date, 'yyyy-MM-dd');
                      const workout = workouts.find(w => {
                        const workoutDate = format(parseISO(w.date), 'yyyy-MM-dd');
                        const matches = workoutDate === cellDateStr;
                        if (matches) {
                          console.log(`Found workout for ${cellDateStr} at position [${rowIndex},${colIndex}] (${DAYS_OF_WEEK[rowIndex]})`);
                        }
                        return matches;
                      });
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="grid-cell"
                          style={{
                            backgroundColor: workout ? getIntensityColor(workout.intensity) : '#ebedf0',
                          }}
                          onClick={(e) => {
                            if (workout) {
                              setTooltip({
                                workout,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }
                          }}
                          title={`${format(date, 'MMM d, yyyy')}${workout ? ` - ${workout.name}` : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="intensity-legend">
              <span>Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                <div
                  key={intensity}
                  className="legend-item"
                  style={{ backgroundColor: getIntensityColor(intensity) }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="year-selector">
            {yearOptions.map(year => (
              <button
                key={year}
                className={`year-button ${year === selectedYear ? 'selected' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="placeholder-box" />
        {tooltip.workout && (
          <WorkoutTooltip
            workout={tooltip.workout}
            position={tooltip.position}
            onClose={() => setTooltip({ workout: null, position: { x: 0, y: 0 } })}
          />
        )}
      </div>
    </div>
  );
}; 