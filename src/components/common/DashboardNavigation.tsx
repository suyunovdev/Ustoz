'use client';

import { useState } from 'react';

import Icon from '@/components/ui/AppIcon';

interface NavigationTab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface DashboardNavigationProps {
  userRole: 'teacher' | 'student';
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const DashboardNavigation = ({ 
  userRole, 
  activeTab = 'overview',
  onTabChange 
}: DashboardNavigationProps) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const teacherTabs: NavigationTab[] = [
    { id: 'overview', label: 'Overview', icon: 'HomeIcon' },
    { id: 'courses', label: 'My Courses', icon: 'BookOpenIcon', count: 0 },
    { id: 'earnings', label: 'Earnings', icon: 'CurrencyDollarIcon' },
    { id: 'analytics', label: 'Analytics', icon: 'ChartBarIcon' },
  ];

  const studentTabs: NavigationTab[] = [
    { id: 'overview', label: 'Overview', icon: 'HomeIcon' },
    { id: 'my-courses', label: 'My Courses', icon: 'BookOpenIcon', count: 0 },
    { id: 'progress', label: 'Progress', icon: 'AcademicCapIcon' },
    { id: 'certificates', label: 'Certificates', icon: 'TrophyIcon' },
  ];

  const tabs = userRole === 'teacher' ? teacherTabs : studentTabs;

  const navItems = [
    { label: 'Dashboard', path: '/teacher-dashboard', icon: 'HomeIcon' },
    { label: 'Create Course', path: '/course-creation', icon: 'PlusCircleIcon' },
    { label: 'Marketplace', path: '/course-marketplace', icon: 'ShoppingBagIcon' },
    { label: 'Moderation', path: '/content-moderation-dashboard', icon: 'ShieldCheckIcon', adminOnly: true },
    { label: 'Profile', path: '/profile', icon: 'UserIcon' }
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-2">
      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center space-x-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-smooth ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-warm'
                  : 'text-foreground hover:bg-muted hover:-translate-y-0.5'
              }`}
            >
              <Icon name={tab.icon as any} size={20} />
              <span className="font-medium">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs font-data rounded-full ${
                  isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden space-y-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-smooth ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name={tab.icon as any} size={20} />
                <span className="font-medium">{tab.label}</span>
              </div>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-data rounded-full ${
                  isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardNavigation;