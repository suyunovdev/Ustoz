'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  performance: 'high' | 'medium' | 'low';
  attendance: number;
  averageScore: number;
  enrolledCourses: string[];
}

interface StudentSelectionPanelProps {
  availableStudents: Student[];
  selectedStudents: Student[];
  onSelectionChange: (students: Student[]) => void;
  maxStudents: number;
}

const StudentSelectionPanel = ({
  availableStudents,
  selectedStudents,
  onSelectionChange,
  maxStudents
}: StudentSelectionPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const allCourses = Array.from(
    new Set(availableStudents.flatMap((s) => s.enrolledCourses))
  );

  const filteredStudents = availableStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPerformance =
      performanceFilter === 'all' || student.performance === performanceFilter;
    const matchesCourse =
      courseFilter === 'all' || student.enrolledCourses.includes(courseFilter);
    return matchesSearch && matchesPerformance && matchesCourse;
  });

  const isSelected = (studentId: string) => {
    return selectedStudents.some((s) => s.id === studentId);
  };

  const toggleStudent = (student: Student) => {
    if (isSelected(student.id)) {
      onSelectionChange(selectedStudents.filter((s) => s.id !== student.id));
    } else {
      if (selectedStudents.length < maxStudents) {
        onSelectionChange([...selectedStudents, student]);
      }
    }
  };

  const selectAll = () => {
    const remaining = maxStudents - selectedStudents.length;
    const toAdd = filteredStudents
      .filter((s) => !isSelected(s.id))
      .slice(0, remaining);
    onSelectionChange([...selectedStudents, ...toAdd]);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high':
        return {
          label: 'Yuqori',
          color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
        };
      case 'medium':
        return {
          label: 'O\'rta',
          color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
        };
      case 'low':
        return {
          label: 'Past',
          color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
        };
      default:
        return { label: '', color: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      <div className="bg-muted rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="UserGroupIcon" size={24} className="text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                Tanlangan: {selectedStudents.length} / {maxStudents}
              </p>
              <p className="text-sm text-muted-foreground">
                Yana {maxStudents - selectedStudents.length} ta o'quvchi qo'shishingiz mumkin
              </p>
            </div>
          </div>
          {selectedStudents.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md hover:bg-red-500/20 transition-smooth text-sm font-medium"
            >
              Hammasini olib tashlash
            </button>
          )}
        </div>
        {selectedStudents.length >= maxStudents && (
          <div className="mt-3 bg-amber-500/10 rounded-md p-3 border border-amber-500/30">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              ⚠️ Maksimal o'quvchilar soniga yetdingiz. Yana qo'shish uchun birorta o'quvchini olib tashlang yoki maksimal sonni oshiring.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Icon
            name="MagnifyingGlassIcon"
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism yoki email bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Natija darajasi
            </label>
            <div className="relative">
              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
              >
                <option value="all">Barchasi</option>
                <option value="high">Yuqori</option>
                <option value="medium">O'rta</option>
                <option value="low">Past</option>
              </select>
              <Icon
                name="ChevronDownIcon"
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kurs bo'yicha
            </label>
            <div className="relative">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
              >
                <option value="all">Barcha kurslar</option>
                {allCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
              <Icon
                name="ChevronDownIcon"
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} ta o'quvchi topildi
          </p>
          {filteredStudents.length > 0 && selectedStudents.length < maxStudents && (
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-smooth text-sm font-medium"
            >
              Ko'rsatilganlarni tanlash
            </button>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-md">
            <Icon name="UserGroupIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">O'quvchilar topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1">Qidiruv yoki filtrlarni o'zgartiring</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const selected = isSelected(student.id);
            const badge = getPerformanceBadge(student.performance);
            const canSelect = selectedStudents.length < maxStudents || selected;

            return (
              <button
                key={student.id}
                onClick={() => toggleStudent(student)}
                disabled={!canSelect}
                className={`w-full p-4 rounded-md border-2 transition-smooth text-left ${
                  selected
                    ? 'bg-primary/10 border-primary'
                    : canSelect
                    ? 'bg-card border-border hover:border-primary/50' :'bg-muted border-border opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <AppImage
                      src={student.avatar}
                      alt={`${student.name} avatar`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {selected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Icon name="CheckIcon" size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center space-x-2">
                        <Icon name="ChartBarIcon" size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">O'rtacha ball</p>
                          <p className="text-sm font-semibold text-foreground">{student.averageScore}%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon name="CalendarIcon" size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Davomat</p>
                          <p className="text-sm font-semibold text-foreground">{student.attendance}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Enrolled Courses */}
                    {student.enrolledCourses.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {student.enrolledCourses.map((course) => (
                          <span
                            key={course}
                            className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentSelectionPanel;