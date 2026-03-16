import React from 'react';
import { Student } from '../types';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import ClassLeaderDashboard from './ClassLeaderDashboard';
import GroupLeaderDashboard from './GroupLeaderDashboard';

interface DashboardProps {
  profile: Student;
}

export default function Dashboard({ profile }: DashboardProps) {
  switch (profile.role) {
    case 'teacher':
      return <TeacherDashboard profile={profile} />;
    case 'class_leader':
      return <ClassLeaderDashboard profile={profile} />;
    case 'group_leader':
      return <GroupLeaderDashboard profile={profile} />;
    default:
      return <StudentDashboard profile={profile} />;
  }
}
