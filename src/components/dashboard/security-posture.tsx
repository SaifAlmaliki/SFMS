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

export function SecurityPosture() {
  const [score, setScore] = useState(86);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('up');
  const [change, setChange] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
        setScore(prevScore => {
            const changePercentage = (Math.random() - 0.4) * 5; // Fluctuate between ~ -2 to +3
            let newScore = prevScore + changePercentage;
            newScore = Math.max(0, Math.min(100, newScore)); // Clamp between 0 and 100

            setTrend(newScore > prevScore ? 'up' : 'down');
            setChange(Math.abs(newScore - prevScore));

            return newScore;
        });
    }, 7000); // Update every 7 seconds

    return () => clearInterval(interval);
  }, []);

  const chartData = [{ score }];
  const trendIsUp = trend === 'up';

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
          Posture {trendIsUp ? 'improving' : 'declining'} 
          {trendIsUp ? (
            <TrendingUp className="h-4 w-4 text-accent" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          {trendIsUp ? 'Up' : 'Down'} {change.toFixed(1)}% from last check.
        </div>
      </CardFooter>
    </Card>
  );
}
