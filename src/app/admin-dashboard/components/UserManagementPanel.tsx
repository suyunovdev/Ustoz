// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student' | 'admin';
  created_at: string;
  avatar_url?: string;
}

const UserManagementPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'teacher' | 'student' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // TODO: add /api/admin/users endpoint (returns user_profiles list with role filter)
      // For now, the panel renders the empty state so the UI doesn't crash.
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { label: 'Admin', color: 'bg-destructive/10 text-destructive' },
      teacher: { label: 'O\'qituvchi', color: 'bg-primary/10 text-primary' },
      student: { label: 'Talaba', color: 'bg-success/10 text-success' }
    };
    return config[role as keyof typeof config] || config.student;
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-md transition-smooth ${
                filterRole === 'all' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterRole('teacher')}
              className={`px-4 py-2 rounded-md transition-smooth ${
                filterRole === 'teacher' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              O'qituvchilar
            </button>
            <button
              onClick={() => setFilterRole('student')}
              className={`px-4 py-2 rounded-md transition-smooth ${
                filterRole === 'student' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Talabalar
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-2 rounded-md transition-smooth ${
                filterRole === 'admin' ?'bg-primary text-primary-foreground' :'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Adminlar
            </button>
          </div>

          <div className="relative">
            <Icon name="MagnifyingGlassIcon" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-6">
          Foydalanuvchilar ({filteredUsers.length})
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={`user-skeleton-${i}`} className="animate-pulse">
                <div className="h-16 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="UserGroupIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Foydalanuvchilar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted transition-smooth"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                      <Icon name="UserIcon" size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                    <button
                      onClick={() => {
                        // TODO: add /api/admin/users/[id] PATCH endpoint for suspend/role change
                        try {
                          console.warn('User actions endpoint not implemented yet:', user.id);
                          alert("Bu funksiya tez orada qo'shiladi");
                        } catch (err) {
                          console.warn(err);
                        }
                      }}
                      className="p-2 hover:bg-muted rounded-md transition-smooth"
                    >
                      <Icon name="EllipsisVerticalIcon" size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel;
