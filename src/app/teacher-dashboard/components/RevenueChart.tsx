'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    payout: number;
  }>;
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <div className="bg-card rounded-md shadow-warm p-6">
      <h3 className="text-xl font-heading font-semibold text-foreground mb-6">Daromad tahlili</h3>
      <div className="w-full h-80" aria-label="Monthly Revenue Bar Chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 76, 117, 0.12)" />
            <XAxis 
              dataKey="month" 
              stroke="#4A5568"
              style={{ fontSize: '14px' }}
            />
            <YAxis 
              stroke="#4A5568"
              style={{ fontSize: '14px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid rgba(15, 76, 117, 0.12)',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="revenue" 
              fill="#0F4C75" 
              name="Umumiy daromad"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="payout" 
              fill="#3282B8" 
              name="To'lov (70%)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;