'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';

interface AnalyticsChartsProps {
  expanded?: boolean;
}

const AnalyticsCharts = ({ expanded = false }: AnalyticsChartsProps) => {
  const userGrowthData = [
    { month: 'Yan', users: 120, teachers: 15, students: 105 },
    { month: 'Fev', users: 185, teachers: 22, students: 163 },
    { month: 'Mar', users: 245, teachers: 28, students: 217 },
    { month: 'Apr', users: 312, teachers: 35, students: 277 },
    { month: 'May', users: 398, teachers: 42, students: 356 },
    { month: 'Iyun', users: 467, teachers: 48, students: 419 }
  ];

  const courseCompletionData = [
    { month: 'Yan', completion: 65, enrollment: 85 },
    { month: 'Fev', completion: 68, enrollment: 88 },
    { month: 'Mar', completion: 72, enrollment: 90 },
    { month: 'Apr', completion: 75, enrollment: 92 },
    { month: 'May', completion: 78, enrollment: 94 },
    { month: 'Iyun', completion: 82, enrollment: 95 }
  ];

  const engagementData = [
    { day: 'Dush', active: 245, sessions: 1250 },
    { day: 'Sesh', active: 312, sessions: 1580 },
    { day: 'Chor', active: 289, sessions: 1420 },
    { day: 'Pay', active: 356, sessions: 1780 },
    { day: 'Jum', active: 398, sessions: 1950 },
    { day: 'Shan', active: 178, sessions: 890 },
    { day: 'Yak', active: 156, sessions: 780 }
  ];

  return (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-semibold text-foreground">Foydalanuvchilar o'sishi</h3>
            <p className="text-sm text-muted-foreground">Oylik statistika</p>
          </div>
          <Icon name="UserGroupIcon" size={24} className="text-primary" />
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 76, 117, 0.12)" />
              <XAxis dataKey="month" stroke="#4A5568" style={{ fontSize: '14px' }} />
              <YAxis stroke="#4A5568" style={{ fontSize: '14px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(15, 76, 117, 0.12)',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="teachers" fill="#0F4C75" name="O'qituvchilar" radius={[8, 8, 0, 0]} />
              <Bar dataKey="students" fill="#3282B8" name="Talabalar" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Completion Chart */}
        <div className="bg-card rounded-md shadow-warm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-heading font-semibold text-foreground">Kurs tugatish darajasi</h3>
              <p className="text-sm text-muted-foreground">Oylik ko'rsatkichlar</p>
            </div>
            <Icon name="AcademicCapIcon" size={24} className="text-success" />
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={courseCompletionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 76, 117, 0.12)" />
                <XAxis dataKey="month" stroke="#4A5568" style={{ fontSize: '14px' }} />
                <YAxis stroke="#4A5568" style={{ fontSize: '14px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(15, 76, 117, 0.12)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Line type="monotone" dataKey="completion" stroke="#10B981" strokeWidth={2} name="Tugatish %" />
                <Line type="monotone" dataKey="enrollment" stroke="#3282B8" strokeWidth={2} name="Ro'yxatdan o'tish %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-card rounded-md shadow-warm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-heading font-semibold text-foreground">Haftalik faollik</h3>
              <p className="text-sm text-muted-foreground">Faol foydalanuvchilar</p>
            </div>
            <Icon name="ChartBarIcon" size={24} className="text-secondary" />
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 76, 117, 0.12)" />
                <XAxis dataKey="day" stroke="#4A5568" style={{ fontSize: '14px' }} />
                <YAxis stroke="#4A5568" style={{ fontSize: '14px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(15, 76, 117, 0.12)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="active" fill="#F59E0B" name="Faol foydalanuvchilar" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;