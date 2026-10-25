
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "./AdminUsers.css";

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to load users."
  );
}

function displayRole(role) {
  if (role === "admin") return "Admin";
  if (role === "customer") return "Customer";
  if (role === "user") return "Customer (legacy role)";
  return role || "Unknown";
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/users", {
          params: {
            page,
            limit: 10,
            search: search || undefined,
            role: role === "all" ? undefined : role,
          },
        });

        setUsers(response.data.users || []);
        setPagination(
          response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            totalUsers: 0,
            limit: 10,
          }
        );
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [search, role]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function handleRoleChange(event) {
    setRole(event.target.value);
  }

  const activeCount = users.filter(
    (user) => user.isActive === true
  ).length;

  const inactiveCount = users.filter(
    (user) => user.isActive === false
  ).length;

  return (
    <section className="admin-users-page">
      <header className="admin-users-header">
        <div>
          <p className="admin-users-eyebrow">
            VERDANT / STORE MANAGEMENT
          </p>
          <h1>Manage users</h1>
          <p className="admin-users-description">
            View registered accounts and their account details.
          </p>
        </div>

        <Link className="admin-users-back" to="/admin">
          Back to dashboard
        </Link>
      </header>

      <div className="admin-users-summary-grid">
        <article className="admin-users-summary-card">
          <span>Matching accounts</span>
          <strong>{pagination.totalUsers}</strong>
        </article>

        <article className="admin-users-summary-card">
          <span>Active on this page</span>
          <strong>{activeCount}</strong>
        </article>

        <article className="admin-users-summary-card">
          <span>Inactive on this page</span>
          <strong>{inactiveCount}</strong>
        </article>
      </div>

      <form
        className="admin-users-filters"
        onSubmit={handleSearch}
      >
        <label className="admin-users-search-field">
          <span>Search users</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search name or email..."
            maxLength={100}
          />
        </label>

        <label className="admin-users-role-field">
          <span>Account role</span>
          <select value={role} onChange={handleRoleChange}>
            <option value="all">All roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Administrators</option>
          </select>
        </label>

        <button
          className="admin-users-primary"
          type="submit"
          disabled={loading}
        >
          Search
        </button>
      </form>

      {error && (
        <div className="admin-users-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="admin-users-secondary"
            onClick={() => loadUsers(pagination.currentPage)}
          >
            Try again
          </button>
        </div>
      )}

      <div className="admin-users-table-wrap">
        {loading ? (
          <p className="admin-users-message" role="status">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="admin-users-message">
            No users found. Try another search or role.
          </p>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Account status</th>
                <th>Registered</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="admin-users-account">
                      <span
                        className="admin-users-avatar"
                        aria-hidden="true"
                      >
                        {(user.name || "?")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div className="admin-users-account-details">
                        <strong>{user.name || "Unnamed user"}</strong>
                        <span>{user.email}</span>
                        <small>ID: {user._id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`admin-users-role ${
                        user.role === "admin"
                          ? "admin-users-role-admin"
                          : ""
                      }`}
                    >
                      {displayRole(user.role)}
                    </span>
                  </td>

                  <td>
                    {user.isActive === true ? (
                      <span className="admin-users-status admin-users-status-active">
                        Active
                      </span>
                    ) : user.isActive === false ? (
                      <span className="admin-users-status admin-users-status-inactive">
                        Inactive
                      </span>
                    ) : (
                      <span className="admin-users-status admin-users-status-unknown">
                        Not set (legacy)
                      </span>
                    )}
                  </td>

                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="admin-users-pagination">
        <span>
          Page {pagination.currentPage} of{" "}
          {Math.max(1, pagination.totalPages)}
          {" · "}
          {pagination.totalUsers} matching accounts
        </span>

        <div>
          <button
            type="button"
            className="admin-users-secondary"
            disabled={loading || pagination.currentPage <= 1}
            onClick={() => loadUsers(pagination.currentPage - 1)}
          >
            Previous
          </button>

          <button
            type="button"
            className="admin-users-secondary"
            disabled={
              loading ||
              pagination.currentPage >= pagination.totalPages
            }
            onClick={() => loadUsers(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
