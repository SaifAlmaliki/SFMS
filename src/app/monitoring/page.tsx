'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const trafficData = [
  { time: '00:00', ingress: 4000, egress: 2400 },
  { time: '02:00', ingress: 3000, egress: 1398 },
  { time: '04:00', ingress: 2000, egress: 9800 },
  { time: '06:00', ingress: 2780, egress: 3908 },
  { time: '08:00', ingress: 1890, egress: 4800 },
  { time: '10:00', ingress: 2390, egress: 3800 },
  { time: '12:00', ingress: 3490, egress: 4300 },
];

const threatsData = [
    { time: '00:00', count: 12 },
    { time: '02:00', count: 5 },
    { time: '04:00', count: 23 },
    { time: '06:00', count: 8 },
    { time: '08:00', count: 15 },
    { time: '10:00', count: 9 },
    { time: '12:00', count: 18 },
]

const latencyData = [
    { time: '00:00', latency: 22 },
    { time: '02:00', latency: 25 },
    { time: '04:00', latency: 30 },
    { time: '06:00', latency: 28 },
    { time: '08:00', latency: 35 },
    { time: '10:00', latency: 32 },
    { time: '12:00', latency: 38 },
];

const packetLossData = [
    { time: '00:00', loss: 0.1 },
    { time: '02:00', loss: 0.05 },
    { time: '04:00', loss: 0.2 },
    { time: '06:00', loss: 0.15 },
    { time: '08:00', loss: 0.3 },
    { time: '10:00', loss: 0.25 },
    { time: '12:00', loss: 0.4 },
];


export default function MonitoringPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Monitoring</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Network Traffic</CardTitle>
            <CardDescription>Ingress vs. Egress traffic over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ingress: { label: 'Ingress', color: 'hsl(var(--chart-1))' },
                egress: { label: 'Egress', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={trafficData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <defs>
                  <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ingress)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-ingress)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-egress)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-egress)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="ingress"
                  stroke="var(--color-ingress)"
                  fillOpacity={1} 
                  fill="url(#colorIngress)"
                />
                <Area
                  type="monotone"
                  dataKey="egress"
                  stroke="var(--color-egress)"
                  fillOpacity={1}
                  fill="url(#colorEgress)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Threats Detected</CardTitle>
            <CardDescription>Number of threats detected over time.</CardDescription>
          </CardHeader>
          <CardContent>
          <ChartContainer
              config={{
                count: { label: 'Threats', color: 'hsl(var(--destructive))' },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={threatsData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  fillOpacity={1} 
                  fill="url(#colorThreats)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Latency</CardTitle>
                <CardDescription>Network latency over time.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer
              config={{
                latency: { label: 'Latency (ms)', color: 'hsl(var(--chart-4))' },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={latencyData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                 <Bar dataKey="latency" fill="var(--color-latency)" radius={4} />
              </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Packet Loss</CardTitle>
                <CardDescription>Packet loss percentage over time.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer
              config={{
                loss: { label: 'Loss (%)', color: 'hsl(var(--chart-5))' },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={packetLossData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <defs>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-loss)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-loss)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="loss"
                    stroke="var(--color-loss)"
                    fillOpacity={1} 
                    fill="url(#colorLoss)"
                    />
              </AreaChart>
            </ChartContainer>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
