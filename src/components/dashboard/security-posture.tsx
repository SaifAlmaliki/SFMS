'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RadialBar, RadialBarChart } from 'recharts';
import { getDeviceHealthAction } from '@/app/actions';

export function SecurityPosture() {
  const [score, setScore] = useState(86);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [change, setChange] = useState(0);
  const [prevScore, setPrevScore] = useState(86);

  const calculateSecurityScore = (devices: any[]) => {
    if (devices.length === 0) {
      return 0; // No devices = no security
    }

    let totalScore = 0;
    let deviceCount = 0;

    devices.forEach((device) => {
      deviceCount++;
      if (device.status === 'Online') {
        totalScore += 100; // Online device = 100 points
      } else if (device.status === 'Warning') {
        totalScore += 60; // Warning device = 60 points
      } else {
        totalScore += 0; // Offline device = 0 points
      }
    });

    // Average score across all devices
    const avgScore = deviceCount > 0 ? totalScore / deviceCount : 0;
    
    // Round to nearest integer
    return Math.round(avgScore);
  };

  const fetchSecurityPosture = async () => {
    try {
      const result = await getDeviceHealthAction();
      
      if (result.success && result.devices) {
        const newScore = calculateSecurityScore(result.devices);
        const oldScore = score;
        
        setPrevScore(oldScore);
        setScore(newScore);
        
        // Determine trend
        if (newScore > oldScore) {
          setTrend('up');
          setChange(newScore - oldScore);
        } else if (newScore < oldScore) {
          setTrend('down');
          setChange(oldScore - newScore);
        } else {
          setTrend('stable');
          setChange(0);
        }
      }
    } catch (err) {
      console.error('Error fetching security posture:', err);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchSecurityPosture();
    
    // Then fetch every 30 seconds
    const interval = setInterval(fetchSecurityPosture, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = [{ score }];
  const trendIsUp = trend === 'up';
  const trendIsDown = trend === 'down';

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">Security Posture</CardTitle>
        <CardDescription>Your organization's current risk score.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-0">
        <ChartContainer
          config={{
            score: {
              label: 'Score',
              color: 'hsl(var(--accent))',
            },
          }}
          className="mx-auto aspect-square h-[160px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={-270}
            innerRadius="70%"
            outerRadius="100%"
            barSize={20}
          >
            <RadialBar
              dataKey="score"
              background
              cornerRadius={10}
              className="fill-accent transition-all duration-500"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-4xl font-bold"
            >
              {score.toFixed(0)}
            </text>
            <text
              x="50%"
              y="65%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              / 100
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          {trendIsUp && 'Posture improving'}
          {trendIsDown && 'Posture declining'}
          {trend === 'stable' && 'Posture stable'}
          {trendIsUp && <TrendingUp className="h-4 w-4 text-accent" />}
          {trendIsDown && <TrendingDown className="h-4 w-4 text-destructive" />}
        </div>
        <div className="leading-none text-muted-foreground">
          {trendIsUp && `Up ${change} points from last check.`}
          {trendIsDown && `Down ${change} points from last check.`}
          {trend === 'stable' && 'No change from last check.'}
        </div>
      </CardFooter>
    </Card>
  );
}
