import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ManageAdmins() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [openAdminId, setOpenAdminId] =
    useState(null);

  const [permissionValues, setPermissionValues] =
    useState({});

  const [subjectValues, setSubjectValues] =
    useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [adminsResponse, subjectsResponse] =
        await Promise.all([
          api.get("/master/admins"),
          api.get("/master/subjects"),
        ]);

      const fetchedAdmins =
        adminsResponse.data.admins || [];

      const fetchedSubjects =
        subjectsResponse.data.subjects || [];

      setAdmins(fetchedAdmins);
      setSubjects(fetchedSubjects);

      const permissions = {};
      const assignedSubjects = {};

      fetchedAdmins.forEach((admin) => {
        permissions[admin._id || admin.id] = {
          approveNotes:
            admin.permissions?.approveNotes ||
            false,

          rejectNotes:
            admin.permissions?.rejectNotes ||
            false,

          deleteNotes:
            admin.permissions?.deleteNotes ||
            false,

          editContent:
            admin.permissions?.editContent ||
            false,

          manageSubjects:
            admin.permissions?.manageSubjects ||
            false,

          disableUsers:
            admin.permissions?.disableUsers ||
            false,

          viewStatistics:
            admin.permissions?.viewStatistics ||
            false,
        };

        assignedSubjects[
          admin._id || admin.id
        ] = (
          admin.assignedSubjects || []
        ).map((subject) =>
          typeof subject === "string"
            ? subject
            : subject._id
        );
      });

      setPermissionValues(permissions);
      setSubjectValues(assignedSubjects);
    } catch (error) {
      console.error(
        "Failed to fetch admin management data:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load admin management data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Please provide name, email and password."
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Admin password must be at least 6 characters."
      );
      return;
    }

    try {
      setCreating(true);

      const response = await api.post(
        "/master/admins",
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }
      );

      const newAdmin = response.data.admin;

      setAdmins((currentAdmins) => [
        ...currentAdmins,
        newAdmin,
      ]);

      const adminId =
        newAdmin._id || newAdmin.id;

      setPermissionValues((current) => ({
        ...current,
        [adminId]: {
          approveNotes:
            newAdmin.permissions
              ?.approveNotes || false,

          rejectNotes:
            newAdmin.permissions
              ?.rejectNotes || false,

          deleteNotes:
            newAdmin.permissions
              ?.deleteNotes || false,

          editContent:
            newAdmin.permissions
              ?.editContent || false,

          manageSubjects:
            newAdmin.permissions
              ?.manageSubjects || false,

          disableUsers:
            newAdmin.permissions
              ?.disableUsers || false,

          viewStatistics:
            newAdmin.permissions
              ?.viewStatistics || false,
        },
      }));

      setSubjectValues((current) => ({
        ...current,
        [adminId]: [],
      }));

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      setShowCreateForm(false);

      setMessage(
        response.data.message ||
          "Admin created successfully."
      );
    } catch (error) {
      console.error(
        "Create admin error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create admin."
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleAdminPanel = (adminId) => {
    setMessage("");
    setError("");

    setOpenAdminId((current) =>
      current === adminId
        ? null
        : adminId
    );
  };

  const handlePermissionChange = (
    adminId,
    permission
  ) => {
    setPermissionValues((current) => ({
      ...current,
      [adminId]: {
        ...current[adminId],
        [permission]:
          !current[adminId]?.[permission],
      },
    }));
  };

  const handleSubjectChange = (
    adminId,
    subjectId
  ) => {
    setSubjectValues((current) => {
      const existing =
        current[adminId] || [];

      const alreadySelected =
        existing.includes(subjectId);

      return {
        ...current,
        [adminId]: alreadySelected
          ? existing.filter(
              (id) => id !== subjectId
            )
          : [...existing, subjectId],
      };
    });
  };

  const savePermissions = async (admin) => {
    const adminId =
      admin._id || admin.id;

    try {
      setUpdatingId(adminId);
      setError("");
      setMessage("");

      const permissions =
        permissionValues[adminId] || {};

      const response = await api.put(
        `/master/admins/${adminId}/permissions`,
        {
          approveNotes:
            !!permissions.approveNotes,

          rejectNotes:
            !!permissions.rejectNotes,

          deleteNotes:
            !!permissions.deleteNotes,

          editContent:
            !!permissions.editContent,

          manageSubjects:
            !!permissions.manageSubjects,

          disableUsers:
            !!permissions.disableUsers,

          viewStatistics:
            !!permissions.viewStatistics,
        }
      );

      const updatedAdmin =
        response.data.admin;

      setAdmins((currentAdmins) =>
        currentAdmins.map((item) =>
          (item._id || item.id) === adminId
            ? {
                ...item,
                permissions:
                  updatedAdmin?.permissions ||
                  permissions,
              }
            : item
        )
      );

      setMessage(
        response.data.message ||
          "Admin permissions updated successfully."
      );
    } catch (error) {
      console.error(
        "Update admin permissions error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update admin permissions."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const saveSubjects = async (admin) => {
    const adminId =
      admin._id || admin.id;

    try {
      setUpdatingId(adminId);
      setError("");
      setMessage("");

      const selectedSubjects =
        subjectValues[adminId] || [];

      const response = await api.put(
        `/master/admins/${adminId}/subjects`,
        {
          subjectIds: selectedSubjects,
        }
      );

      const updatedAdmin =
        response.data.admin;

      setAdmins((currentAdmins) =>
        currentAdmins.map((item) =>
          (item._id || item.id) === adminId
            ? {
                ...item,
                assignedSubjects:
                  updatedAdmin?.assignedSubjects ||
                  item.assignedSubjects,
              }
            : item
        )
      );

      setMessage(
        response.data.message ||
          "Admin subjects updated successfully."
      );
    } catch (error) {
      console.error(
        "Update admin subjects error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update admin subjects."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (admin) => {
    const adminId =
      admin._id || admin.id;

    const action = admin.isActive
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} admin "${admin.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(adminId);
      setError("");
      setMessage("");

      const response = await api.put(
        `/master/admins/${adminId}/toggle-status`
      );

      const updatedAdmin =
        response.data.admin;

      setAdmins((currentAdmins) =>
        currentAdmins.map((item) =>
          (item._id || item.id) === adminId
            ? {
                ...item,
                isActive:
                  updatedAdmin?.isActive ??
                  !item.isActive,
              }
            : item
        )
      );

      setMessage(
        response.data.message ||
          "Admin status updated successfully."
      );
    } catch (error) {
      console.error(
        "Toggle admin status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update admin status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const adminId =
      admin._id || admin.id;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete admin "${admin.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(adminId);
      setError("");
      setMessage("");

      const response = await api.delete(
        `/master/admins/${adminId}`
      );

      setAdmins((currentAdmins) =>
        currentAdmins.filter(
          (item) =>
            (item._id || item.id) !== adminId
        )
      );

      setOpenAdminId(null);

      setMessage(
        response.data.message ||
          "Admin deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete admin error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete admin."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getAssignedSubjectNames = (admin) => {
    if (!admin.assignedSubjects?.length) {
      return "No subjects assigned";
    }

    return admin.assignedSubjects
      .map((subject) =>
        typeof subject === "string"
          ? subject
          : subject.code || subject.name
      )
      .join(", ");
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading admins...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error && admins.length === 0) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>
              Unable to load admin management
            </h2>

            <p>{error}</p>

            <button onClick={fetchData}>
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
        <div className="master-admins-page">

          {/* HEADER */}
          <div className="master-admins-header">
            <div>
              <button
                className="master-admins-back-button"
                onClick={() =>
                  navigate("/master")
                }
              >
                ← Master Dashboard
              </button>

              <h1>Manage Admins</h1>

              <p>
                Create admins and control their
                subjects and permissions.
              </p>
            </div>

            <button
              className="master-create-admin-button"
              onClick={() => {
                setMessage("");
                setError("");

                setShowCreateForm(
                  (current) => !current
                );
              }}
            >
              {showCreateForm
                ? "✕ Close"
                : "+ Create Admin"}
            </button>
          </div>

          {/* MESSAGES */}
          {message && (
            <div className="master-admin-success">
              <span>✓</span>
              <p>{message}</p>
            </div>
          )}

          {error && (
            <div className="master-admin-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* CREATE ADMIN */}
          {showCreateForm && (
            <div className="master-create-admin-card">

              <div className="master-create-admin-heading">
                <h2>Create New Admin</h2>

                <p>
                  Create an admin account. You can
                  assign subjects and permissions
                  after creation.
                </p>
              </div>

              <form
                onSubmit={handleCreateAdmin}
              >
                <div className="master-create-admin-grid">

                  <div className="master-admin-form-group">
                    <label htmlFor="admin-name">
                      Name
                    </label>

                    <input
                      id="admin-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={
                        handleCreateInputChange
                      }
                      placeholder="Admin name"
                      disabled={creating}
                    />
                  </div>

                  <div className="master-admin-form-group">
                    <label htmlFor="admin-email">
                      Email
                    </label>

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={
                        handleCreateInputChange
                      }
                      placeholder="admin@example.com"
                      disabled={creating}
                    />
                  </div>

                  <div className="master-admin-form-group">
                    <label htmlFor="admin-password">
                      Temporary Password
                    </label>

                    <input
                      id="admin-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={
                        handleCreateInputChange
                      }
                      placeholder="Minimum 6 characters"
                      disabled={creating}
                    />
                  </div>

                </div>

                <div className="master-create-admin-actions">

                  <button
                    type="button"
                    className="master-admin-cancel-button"
                    onClick={() =>
                      setShowCreateForm(false)
                    }
                    disabled={creating}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="master-admin-save-button"
                    disabled={creating}
                  >
                    {creating
                      ? "Creating..."
                      : "Create Admin"}
                  </button>

                </div>
              </form>
            </div>
          )}

          {/* SUMMARY */}
          <div className="master-admin-summary">
            <div>
              <strong>
                {admins.length}
              </strong>

              <span>Total Admins</span>
            </div>

            <div>
              <strong>
                {
                  admins.filter(
                    (admin) =>
                      admin.isActive
                  ).length
                }
              </strong>

              <span>Active</span>
            </div>

            <div>
              <strong>
                {
                  admins.filter(
                    (admin) =>
                      !admin.isActive
                  ).length
                }
              </strong>

              <span>Disabled</span>
            </div>
          </div>

          {/* ADMIN LIST */}
          {admins.length === 0 ? (
            <div className="notes-message">
              <h2>No admins found</h2>

              <p>
                Create your first admin account
                to get started.
              </p>
            </div>
          ) : (
            <div className="master-admin-list">

              {admins.map((admin) => {
                const adminId =
                  admin._id || admin.id;

                const permissions =
                  permissionValues[
                    adminId
                  ] || {};

                const selectedSubjects =
                  subjectValues[
                    adminId
                  ] || [];

                const isOpen =
                  openAdminId === adminId;

                const isUpdating =
                  updatingId === adminId;

                return (
                  <div
                    className="master-admin-card"
                    key={adminId}
                  >

                    {/* ADMIN HEADER */}
                    <div className="master-admin-card-header">

                      <div className="master-admin-identity">

                        <div className="master-admin-avatar">
                          {admin.name
                            ?.charAt(0)
                            .toUpperCase() ||
                            "A"}
                        </div>

                        <div>
                          <div className="master-admin-name-row">
                            <h2>
                              {admin.name}
                            </h2>

                            <span
                              className={
                                admin.isActive
                                  ? "master-admin-status active"
                                  : "master-admin-status inactive"
                              }
                            >
                              {admin.isActive
                                ? "Active"
                                : "Disabled"}
                            </span>
                          </div>

                          <p>
                            {admin.email}
                          </p>
                        </div>

                      </div>

                      <button
                        className="master-admin-manage-button"
                        onClick={() =>
                          toggleAdminPanel(
                            adminId
                          )
                        }
                      >
                        {isOpen
                          ? "Close"
                          : "Manage"}
                      </button>

                    </div>

                    {/* QUICK INFO */}
                    <div className="master-admin-quick-info">

                      <div>
                        <span>
                          Assigned Subjects
                        </span>

                        <strong>
                          {
                            admin.assignedSubjects
                              ?.length || 0
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Permissions
                        </span>

                        <strong>
                          {
                            Object.values(
                              admin.permissions ||
                                {}
                            ).filter(Boolean)
                              .length
                          }
                        </strong>
                      </div>

                      <div className="master-admin-subject-summary">
                        <span>
                          Subjects
                        </span>

                        <strong>
                          {getAssignedSubjectNames(
                            admin
                          )}
                        </strong>
                      </div>

                    </div>

                    {/* MANAGEMENT PANEL */}
                    {isOpen && (
                      <div className="master-admin-management">

                        {/* SUBJECT ASSIGNMENT */}
                        <div className="master-admin-management-section">

                          <div className="master-admin-section-heading">
                            <div>
                              <h3>
                                Assigned Subjects
                              </h3>

                              <p>
                                Select the subjects
                                this admin is allowed
                                to manage.
                              </p>
                            </div>

                            <span>
                              {
                                selectedSubjects.length
                              }{" "}
                              selected
                            </span>
                          </div>

                          <div className="master-admin-subject-grid">

                            {subjects.map(
                              (subject) => (
                                <label
                                  className="master-admin-subject-option"
                                  key={
                                    subject._id
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(
                                      subject._id
                                    )}
                                    onChange={() =>
                                      handleSubjectChange(
                                        adminId,
                                        subject._id
                                      )
                                    }
                                  />

                                  <span>
                                    <strong>
                                      {
                                        subject.code
                                      }
                                    </strong>

                                    <small>
                                      {
                                        subject.name
                                      }{" "}
                                      • Sem{" "}
                                      {
                                        subject.semester
                                      }
                                    </small>
                                  </span>
                                </label>
                              )
                            )}

                          </div>

                          <div className="master-admin-save-row">

                            <button
                              className="master-admin-save-button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                saveSubjects(
                                  admin
                                )
                              }
                            >
                              {isUpdating
                                ? "Saving..."
                                : "Save Subjects"}
                            </button>

                          </div>

                        </div>

                        {/* PERMISSIONS */}
                        <div className="master-admin-management-section">

                          <div className="master-admin-section-heading">
                            <div>
                              <h3>
                                Admin Permissions
                              </h3>

                              <p>
                                Control exactly what
                                this admin can do.
                              </p>
                            </div>
                          </div>

                          <div className="master-admin-permission-grid">

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.approveNotes
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "approveNotes"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Approve Notes
                                </strong>

                                <small>
                                  Approve pending
                                  uploads.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.rejectNotes
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "rejectNotes"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Reject Notes
                                </strong>

                                <small>
                                  Reject pending
                                  uploads.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.deleteNotes
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "deleteNotes"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Delete Notes
                                </strong>

                                <small>
                                  Delete notes within
                                  assigned subjects.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.editContent
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "editContent"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Edit Content
                                </strong>

                                <small>
                                  Modify content in
                                  assigned subjects.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.manageSubjects
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "manageSubjects"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Manage Subjects
                                </strong>

                                <small>
                                  Manage assigned
                                  subject settings.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.disableUsers
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "disableUsers"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  Disable Users
                                </strong>

                                <small>
                                  Disable eligible
                                  user accounts.
                                </small>
                              </span>
                            </label>

                            <label className="master-admin-permission-option">
                              <input
                                type="checkbox"
                                checked={
                                  !!permissions.viewStatistics
                                }
                                onChange={() =>
                                  handlePermissionChange(
                                    adminId,
                                    "viewStatistics"
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  View Statistics
                                </strong>

                                <small>
                                  View permitted
                                  dashboard statistics.
                                </small>
                              </span>
                            </label>

                          </div>

                          <div className="master-admin-save-row">

                            <button
                              className="master-admin-save-button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                savePermissions(
                                  admin
                                )
                              }
                            >
                              {isUpdating
                                ? "Saving..."
                                : "Save Permissions"}
                            </button>

                          </div>

                        </div>

                        {/* ADMIN ACCOUNT ACTIONS */}
                        <div className="master-admin-management-section">

                          <div className="master-admin-section-heading">
                            <div>
                              <h3>
                                Account Management
                              </h3>

                              <p>
                                Control this admin
                                account.
                              </p>
                            </div>
                          </div>

                          <div className="master-admin-account-actions">

                            <button
                              className={
                                admin.isActive
                                  ? "master-admin-disable-button"
                                  : "master-admin-enable-button"
                              }
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  admin
                                )
                              }
                            >
                              {isUpdating
                                ? "Updating..."
                                : admin.isActive
                                ? "Disable Admin"
                                : "Enable Admin"}
                            </button>

                            <button
                              className="master-admin-delete-button"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                handleDeleteAdmin(
                                  admin
                                )
                              }
                            >
                              🗑 Delete Admin
                            </button>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
}

export default ManageAdmins;