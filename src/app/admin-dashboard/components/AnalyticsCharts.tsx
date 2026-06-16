'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/AppIcon';

interface ChartData {
  userGrowthData: { month: string; users: number; teachers: number; students: number }[];
  courseCompletionData: { month: string; completion: number; enrollment: number }[];
  engagementData: { day: string; active: number; sessions: number }[];
}

interface AnalyticsChartsProps {
  expanded?: boolean;
}

const AnalyticsCharts = ({ expanded = false }: AnalyticsChartsProps) => {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Analitika ma\'lumotlarini yuklashda xatolik');
        return res.json();
      })
      .then((d) => { if (d) setData(d); })
      .catch((err) => { setError(err.message || 'Kutilmagan xatolik yuz berdi'); })
      .finally(() => setLoading(false));
  }, []);

  const userGrowthData = data?.userGrowthData || [];
  const courseCompletionData = data?.courseCompletionData || [];
  const engagementData = data?.engagementData || [];

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-6 text-center">
        <Icon name="ExclamationTriangleIcon" size={32} className="text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-heading font-semibold text-destructive mb-1">Xatolik yuz berdi</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetch('/api/admin/analytics', { credentials: 'include' }).then((res) => { if (!res.ok) throw new Error('Analitika ma\'lumotlarini yuklashda xatolik'); return res.json(); }).then((d) => { if (d) setData(d); }).catch((err) => { setError(err.message || 'Kutilmagan xatolik yuz berdi'); }).finally(() => setLoading(false)); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth text-sm font-medium"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-md shadow-warm p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-6" />
            <div className="h-80 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

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