import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/master/users");

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchText ||
        user.name?.toLowerCase().includes(searchText) ||
        user.email?.toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          user.isActive === true) ||
        (statusFilter === "DISABLED" &&
          user.isActive === false);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const studentCount = users.filter(
    (user) => user.role === "student"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const activeCount = users.filter(
    (user) => user.isActive === true
  ).length;

  const disabledCount = users.filter(
    (user) => user.isActive === false
  ).length;

  const clearMessages = () => {
    setActionMessage("");
    setActionError("");
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) {
      return;
    }

    const roleName =
      newRole === "admin" ? "Admin" : "Student";

    const confirmed = window.confirm(
      `Are you sure you want to change ${user.name}'s role to ${roleName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      const response = await api.put(
        `/master/users/${user._id}/role`,
        {
          role: newRole,
        }
      );

      const updatedUser = response.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item._id === user._id
            ? {
                ...item,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
              }
            : item
        )
      );

      setActionMessage(
        `${user.name}'s role was changed to ${roleName}.`
      );
    } catch (error) {
      console.error(
        "Change user role error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          "Failed to change user role."
      );
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.isActive
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}'s account?`
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      const response = await api.put(
        `/master/users/${user._id}/toggle-status`
      );

      const updatedUser = response.data.user;

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item._id === user._id
            ? {
                ...item,
                isActive: updatedUser.isActive,
              }
            : item
        )
      );

      setActionMessage(
        `${user.name}'s account was ${
          updatedUser.isActive
            ? "enabled"
            : "disabled"
        }.`
      );
    } catch (error) {
      console.error(
        "Toggle user status error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          "Failed to update account status."
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading users...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>Unable to load users</h2>

            <p>{error}</p>

            <button onClick={fetchUsers}>
              Try Again
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="manage-users-page">

          <div className="manage-users-header">
            <div>
              <h1>Manage Users</h1>

              <p>
                Manage student and admin accounts,
                roles, and account status.
              </p>
            </div>

            <button
              className="manage-users-refresh-button"
              onClick={fetchUsers}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Statistics */}

          <div className="user-stat-grid">

            <div className="user-stat-card">
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>

            <div className="user-stat-card">
              <span>Students</span>
              <strong>{studentCount}</strong>
            </div>

            <div className="user-stat-card">
              <span>Admins</span>
              <strong>{adminCount}</strong>
            </div>

            <div className="user-stat-card">
              <span>Active</span>
              <strong>{activeCount}</strong>
            </div>

            <div className="user-stat-card">
              <span>Disabled</span>
              <strong>{disabledCount}</strong>
            </div>

          </div>

          {/* Messages */}

          {actionMessage && (
            <div className="user-action-success">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="user-action-error">
              {actionError}
            </div>
          )}

          {/* Filters */}

          <div className="user-filters">

            <div className="user-search-wrapper">
              <label htmlFor="user-search">
                Search
              </label>

              <input
                id="user-search"
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="user-filter-wrapper">
              <label htmlFor="role-filter">
                Role
              </label>

              <select
                id="role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
              >
                <option value="ALL">
                  All Roles
                </option>

                <option value="student">
                  Students
                </option>

                <option value="admin">
                  Admins
                </option>
              </select>
            </div>

            <div className="user-filter-wrapper">
              <label htmlFor="status-filter">
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="DISABLED">
                  Disabled
                </option>
              </select>
            </div>

            <button
              className="user-clear-filter-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>

          {/* Result count */}

          <div className="user-results-info">
            Showing{" "}
            <strong>{filteredUsers.length}</strong>{" "}
            of <strong>{users.length}</strong> users
          </div>

          {/* Users */}

          {filteredUsers.length === 0 ? (
            <div className="notes-message">
              <h2>No users found</h2>

              <p>
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="users-list">

              {filteredUsers.map((user) => (
                <div
                  className="user-management-card"
                  key={user._id}
                >

                  <div className="user-management-main">

                    <div className="user-avatar">
                      {user.name
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </div>

                    <div className="user-information">

                      <div className="user-name-row">

                        <h2>
                          {user.name}
                        </h2>

                        <span
                          className={`user-role-badge ${
                            user.role === "admin"
                              ? "user-role-admin"
                              : "user-role-student"
                          }`}
                        >
                          {user.role === "admin"
                            ? "Admin"
                            : "Student"}
                        </span>

                        <span
                          className={`user-status-badge ${
                            user.isActive
                              ? "user-status-active"
                              : "user-status-disabled"
                          }`}
                        >
                          {user.isActive
                            ? "Active"
                            : "Disabled"}
                        </span>

                      </div>

                      <p className="user-email">
                        {user.email}
                      </p>

                      <div className="user-meta">

                        <span>
                          Joined:{" "}
                          {user.createdAt
                            ? new Date(
                                user.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </span>

                        <span>
                          User ID:{" "}
                          {user._id}
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="user-management-actions">

                    <div className="role-control">

                      <label>
                        Change Role
                      </label>

                      <select
                        value={user.role}
                        onChange={(event) =>
                          handleRoleChange(
                            user,
                            event.target.value
                          )
                        }
                      >
                        <option value="student">
                          Student
                        </option>

                        <option value="admin">
                          Admin
                        </option>
                      </select>

                    </div>

                    <button
                      className={
                        user.isActive
                          ? "disable-user-button"
                          : "enable-user-button"
                      }
                      onClick={() =>
                        handleToggleStatus(user)
                      }
                    >
                      {user.isActive
                        ? "Disable Account"
                        : "Enable Account"}
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
}

export default ManageUsers;