import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  time: string;
  members: number;
}

interface ActivityChartProps {
  data: ChartData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="members" stroke="#4f46e5" fill="#818cf8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}