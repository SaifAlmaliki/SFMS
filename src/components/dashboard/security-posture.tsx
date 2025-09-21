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
import { TrendingUp } from 'lucide-react';
import { RadialBar, RadialBarChart } from 'recharts';

const chartData = [{ score: 86 }];

export function SecurityPosture() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Security Posture</CardTitle>
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
              className="fill-accent"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-4xl font-bold"
            >
              {chartData[0].score.toFixed(0)}
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
          Posture improving <TrendingUp className="h-4 w-4 text-accent" />
        </div>
        <div className="leading-none text-muted-foreground">
          Up 5% from last month. Keep it up!
        </div>
      </CardFooter>
    </Card>
  );
}
