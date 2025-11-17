import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Profile from '../pages/Profile';
import CourseCatalog from '../pages/CourseCatalog';
import CourseDetails from '../pages/CourseDetails';
import { AuthGuard, RoleGuard } from '../components/guards/AuthGuard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/Users';
import AdminCourses from '../pages/admin/Courses';
import AdminSettings from '../pages/admin/Settings';
import AdminFeatureToggles from '../pages/admin/FeatureToggles';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AnalyticsDashboard from '../pages/admin/AnalyticsDashboard';
import Card from '../components/ui/Card';
import LearnDashboard from '../pages/learn/LearnDashboard';
import CoursePlayer from '../pages/learn/CoursePlayer';
import LessonViewer from '../pages/learn/LessonViewer';
import Discussions from '../pages/learn/Discussions';
import Assignments from '../pages/learn/Assignments';
import Quizzes from '../pages/learn/Quizzes';
import Certificates from '../pages/learn/Certificates';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import CreateCourse from '../pages/instructor/CreateCourse';
import ManageCourse from '../pages/instructor/ManageCourse';
import ContentBuilder from '../pages/instructor/ContentBuilder';
import Gradebook from '../pages/instructor/Gradebook';

const Placeholder = ({ title, desc }) => (
  <Card className="card" style={{ padding: 16 }}>
    <h2>{title}</h2>
    {desc ? <p style={{ color: 'var(--muted-700)' }}>{desc}</p> : null}
  </Card>
);

// PUBLIC_INTERFACE
export function RoutesRoot() {
  /** Defines all application routes (public and protected) */
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/marketplace" replace />} />
      <Route path="/marketplace" element={<CourseCatalog />} />
      <Route path="/marketplace/:id" element={<CourseDetails />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Authenticated routes */}
      <Route
        path="/learn"
        element={
          <AuthGuard>
            <LearnDashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/:id"
        element={
          <AuthGuard>
            <CoursePlayer />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/:id/lessons/:lessonId"
        element={
          <AuthGuard>
            <LessonViewer />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/discussions"
        element={
          <AuthGuard>
            <Discussions />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/assignments"
        element={
          <AuthGuard>
            <Assignments />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/quizzes"
        element={
          <AuthGuard>
            <Quizzes />
          </AuthGuard>
        }
      />
      <Route
        path="/learn/:id/certificate"
        element={
          <AuthGuard>
            <Certificates />
          </AuthGuard>
        }
      />

      <Route
        path="/profile"
        element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        }
      />

      {/* Instructor routes (protected by role) */}
      <Route
        path="/instructor"
        element={
          <RoleGuard roles={['instructor', 'admin']} fallback="/learn">
            <InstructorDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/instructor/create"
        element={
          <RoleGuard roles={['instructor', 'admin']} fallback="/learn">
            <CreateCourse />
          </RoleGuard>
        }
      />
      <Route
        path="/instructor/manage/:id"
        element={
          <RoleGuard roles={['instructor', 'admin']} fallback="/learn">
            <ManageCourse />
          </RoleGuard>
        }
      />
      <Route
        path="/instructor/content/:id"
        element={
          <RoleGuard roles={['instructor', 'admin']} fallback="/learn">
            <ContentBuilder />
          </RoleGuard>
        }
      />
      <Route
        path="/instructor/gradebook/:id"
        element={
          <RoleGuard roles={['instructor', 'admin']} fallback="/learn">
            <Gradebook />
          </RoleGuard>
        }
      />

      {/* Admin routes (protected by admin role) */}
      <Route
        path="/admin"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminUsers />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminCourses />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminSettings />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/feature-toggles"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminFeatureToggles />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AdminAuditLogs />
          </RoleGuard>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RoleGuard roles={['admin']} fallback="/learn">
            <AnalyticsDashboard />
          </RoleGuard>
        }
      />
      <Route path="*" element={<Placeholder title="Not Found" desc="The page you’re looking for doesn’t exist." />} />
    </Routes>
  );
}
