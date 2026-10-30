import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Sidebar({ links = [], closeSidebar, activeItem }) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    if (closeSidebar) closeSidebar();
  };

  const defaultLinks = [
    { label: "Dashboard", action: () => navigate(`/${role}/dashboard`) },
    ...(role === "student"
      ? [
          { label: "✨ AI Career Suite", action: () => navigate(`/${role}/dashboard?section=ai`) },
          { label: "Available Jobs", action: () => navigate(`/${role}/dashboard?section=jobs`) },
          { label: "My Applications", action: () => navigate(`/${role}/dashboard?section=applications`) },
          { label: "Mock Tests", action: () => navigate(`/${role}/dashboard?section=mock`) },
          { label: "Resume Builder", action: () => navigate(`/${role}/dashboard?section=resume`) },
          { label: "Interview Prep", action: () => navigate(`/${role}/dashboard?section=interview`) },
          { label: "Career Guidance", action: () => navigate(`/${role}/dashboard?section=career`) },
          { label: "Profile", action: () => navigate(`/${role}/dashboard?section=profile`) }
        ]
      : []),
    ...(role === "admin"
      ? [
          { label: "Dashboard", path: "/admin/dashboard/overview" },
          { label: "Pending Approvals", path: "/admin/dashboard/pending-users" },
          { label: "Pending Job Posts", path: "/admin/dashboard/pending-jobs" },
          { label: "Manage Students", path: "/admin/dashboard/students" },
          { label: "Manage Companies", path: "/admin/dashboard/companies" },
          { label: "Placement Drives", path: "/admin/dashboard/drives" },
          { label: "Placement Reports", path: "/admin/dashboard/reports" },
          { label: "Send Emails", path: "/admin/dashboard/email" },
          { label: "Announcements", path: "/admin/dashboard/announcements" },
          { label: "Advanced Analytics", path: "/admin/dashboard/analytics" },
          { label: "Activity Logs", path: "/admin/dashboard/activity" }
        ]
      : []),
    ...(role === "company"
      ? [
          { label: "Post New Job", action: () => navigate(`/${role}/dashboard?tab=post`) },
          { label: "Posted Jobs", action: () => navigate(`/${role}/dashboard?tab=jobs`) },
          { label: "Applications", action: () => navigate(`/${role}/dashboard?tab=applicants`) },
          { label: "Shortlisted Students", action: () => navigate(`/${role}/dashboard?tab=shortlisted`) },
          { label: "Analytics", action: () => navigate(`/${role}/dashboard?tab=analytics`) },
          { label: "Hiring Pipeline", action: () => navigate(`/${role}/dashboard?tab=hiring`) },
          { label: "Manage Students", action: () => navigate(`/${role}/dashboard?tab=students`) },
          { label: "Manage Companies", action: () => navigate(`/${role}/dashboard?tab=companies`) },
          { label: "Placement Drives", action: () => navigate(`/${role}/dashboard?tab=drives`) },
          { label: "Placement Reports", action: () => navigate(`/${role}/dashboard?tab=reports`) },
          { label: "Send Emails", action: () => navigate(`/${role}/dashboard?tab=email`) },
          { label: "Announcements", action: () => navigate(`/${role}/dashboard?tab=announcements`) },
          { label: "Advanced Analytics", action: () => navigate(`/${role}/dashboard?tab=advanced`) },
          { label: "Activity Logs", action: () => navigate(`/${role}/dashboard?tab=activity`) }
        ]
      : [])
  ];

  const menuLinks = links.length > 0 ? links : defaultLinks;

  const getButtonClassName = (link, isActive) => {
    if (link.path) {
      return "sidebar-link";
    }
    return `sidebar-link${isActive ? " active" : ""}`;
  };

  return (
    <div className="sidebar-panel">
      <h2>Placement Portal</h2>

      <ul className="sidebar-menu">
        {menuLinks.map((link) => {
          const isActive = link.id ? activeItem === link.id : false;
          return (
            <li key={link.label}>
              {link.path ? (
                <NavLink
                  to={link.path}
                  className={({ isActive: navIsActive }) => `sidebar-link${navIsActive ? " active" : ""}`}
                  onClick={() => {
                    if (closeSidebar) closeSidebar();
                  }}
                >
                  {link.label}
                </NavLink>
              ) : (
                <button
                  type="button"
                  className={getButtonClassName(link, isActive)}
                  onClick={() => {
                    if (link.action) link.action();
                    if (closeSidebar) closeSidebar();
                  }}
                >
                  {link.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <button onClick={handleLogout} className="sidebar-logout-btn">
        Logout
      </button>
    </div>
  );
}

export default Sidebar;