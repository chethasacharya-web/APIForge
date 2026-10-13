import { useEffect, useState } from "react";
import "./App.css";
import api from "./services/api";
import Login from "./Login";
function App() {
 const [user, setUser] = useState(null);

  const [apis, setApis] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [testingApiId, setTestingApiId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
  name: "",
  description: "",
  url: "",
  method: "GET",
  rateLimitEnabled: true,
  rateLimitMax: 100,
  rateLimitWindowMinutes: 15,
});

  // Load APIs belonging to the logged-in user.
 // Load APIs belonging to the logged-in user.
async function loadApis() {
  setLoading(true);
  setError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setApis([]);
      return;
    }

    const response = await api.get("/apis", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const savedApis = response.data.apis || [];

    setApis(
      savedApis.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        method: item.method,
        url: item.base_url,
        status: "Active",
      }))
    );
  } catch (err) {
    console.error(
      "Loading APIs failed:",
      err.response?.data || err.message
    );

    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      setUser(null);
      setApis([]);
    } else {
      setError(
        err.response?.data?.message ||
          "Could not load APIs. Please check your backend."
      );
    }
  } finally {
    setLoading(false);
  }
}
// Execute a registered API.
async function testApi(item) {
  setTestingApiId(item.id);
  setTestResult(null);
  setError("");

  try {
    const token = localStorage.getItem("token");

    const response = await api.post(
      `/apis/${item.id}/execute`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTestResult({
      apiName: item.name,
      ...response.data.response,
    });
  } catch (err) {
    console.error(
      "API test failed:",
      err.response?.data || err.message
    );

    setTestResult({
      apiName: item.name,
      error:
        err.response?.data?.message ||
        "Unable to execute API. Check the backend and execute route.",
      status: err.response?.status || "Network error",
    });
  } finally {
    setTestingApiId(null);
  }
}
  useEffect(() => {
    if (user) {
      loadApis();
    } else {
      setApis([]);
      setLoading(false);
    }
  }, [user]);
  // Create an API in MySQL.
  async function createApi(event) {
    event.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in before creating an API.");
        return;
      }

      const response = await api.post(
        "/apis",
        {
  name: formData.name,
  description: formData.description,
  base_url: formData.url,
  method: formData.method,

  // Rate-limit settings
  rateLimitEnabled: formData.rateLimitEnabled,
  rateLimitMax: formData.rateLimitMax,
  rateLimitWindowMinutes: formData.rateLimitWindowMinutes,
},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const savedApi = response.data.api;

      setApis((currentApis) => [
        {
          id: savedApi.id,
          name: savedApi.name,
          description: savedApi.description || "",
          method: savedApi.method,
          url: savedApi.base_url,
          status: "Active",
        },
        ...currentApis,
      ]);

      setFormData({
  name: "",
  description: "",
  url: "",
  method: "GET",
  rateLimitEnabled: true,
  rateLimitMax: 100,
  rateLimitWindowMinutes: 15,
});
      setShowForm(false);
      alert("API saved successfully!");
    } catch (err) {
      console.error(
        "Create API failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message || "Could not save the API."
      );
    }
  }

  // Delete an API from MySQL.
  async function deleteApi(id) {
    if (!window.confirm("Delete this API permanently?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in before deleting an API.");
        return;
      }

      await api.delete(`/apis/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApis((currentApis) =>
        currentApis.filter((item) => item.id !== id)
      );

      alert("API deleted successfully!");
    } catch (err) {
      console.error(
        "Delete API failed:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message || "Could not delete the API."
      );
    }
  }

  const filteredApis = apis.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  if (loading && user) {
  return <p>Loading APIForge...</p>;
}

if (!user) {
  return (
    <Login
      onLogin={(loggedInUser) => setUser(loggedInUser)}
    />
  );
}

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <span>APIForge</span>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <button className="nav-item active">
          <span>▦</span> Dashboard
        </button>

        <button className="nav-item">
          <span>⌘</span> API Management
        </button>

        <button className="nav-item">
          <span>⚙</span> Settings
        </button>

        <div className="sidebar-bottom">
          <div className="avatar">A</div>
          <div>
            <strong>APIForge User</strong>
            <p>Developer</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace / Dashboard</span>

          <div className="topbar-right">
            <span className="online-dot"></span>
            Connected workspace
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h1>Dashboard</h1>
              <p className="subtitle">
                Manage your APIs from one central workspace.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              + Create API
            </button>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total APIs</span>
                <span className="stat-icon purple">⌘</span>
              </div>
              <h2>{apis.length}</h2>
              <p>Your registered endpoints</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Active APIs</span>
                <span className="stat-icon green">✓</span>
              </div>
              <h2>
                {apis.filter((item) => item.status === "Active").length}
              </h2>
              <p>Currently marked active</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>HTTP Methods</span>
                <span className="stat-icon orange">↗</span>
              </div>
              <h2>{new Set(apis.map((item) => item.method)).size}</h2>
              <p>Methods represented in this list</p>
            </div>
          </div>

          {showForm && (
            <section className="create-form">
              <div className="section-heading">
                <div>
                  <h2>Register a New API</h2>
                  <p>Enter the details of the API you want to manage.</p>
                </div>

                <button
                  type="button"
                  className="action-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={createApi}>
                <label>
                  API Name
                  <input
                    required
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Weather API"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        name: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Description
                  <input
                    type="text"
                    placeholder="What does this API do?"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        description: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Base URL
                  <input
                    required
                    type="url"
                    maxLength={500}
                    placeholder="https://api.example.com"
                    value={formData.url}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        url: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  HTTP Method
                  <select
                    value={formData.method}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        method: event.target.value,
                      })
                    }
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </label>
                <div className="rate-limit-section">
                  <h3>Rate Limiting</h3>
                  <p>Configure request limits for this API.</p>

                  <label>
                    <input
                      type="checkbox"
                      checked={formData.rateLimitEnabled}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          rateLimitEnabled: event.target.checked,
                        })
                      }
                    />
                    Enable Rate Limiting
                  </label>

                  <label>
                    Maximum Requests
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      required
                      disabled={!formData.rateLimitEnabled}
                      value={formData.rateLimitMax}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          rateLimitMax: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    Time Window
                    <select
                      disabled={!formData.rateLimitEnabled}
                      value={formData.rateLimitWindowMinutes}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          rateLimitWindowMinutes: Number(event.target.value),
                        })
                      }
                    >
                      <option value={1}>1 minute</option>
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </label>
                </div>
                <button className="primary-button" type="submit">
                  Save API
                </button>
              </form>
            </section>
          )}

          <section className="api-section">
            <div className="section-heading">
              <div>
                <h2>Your APIs</h2>
                <p>Review and manage your registered endpoints.</p>
              </div>

              <span className="count-badge">
                {apis.length} APIs
              </span>
            </div>

            <div className="table-toolbar">
              <input
                type="search"
                placeholder="Search APIs by name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search APIs by name"
              />

              <span className="demo-label">LIVE DATABASE</span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>API NAME</th>
                    <th>METHOD</th>
                    <th>BASE URL</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        Loading APIs...
                      </td>
                    </tr>
                  ) : filteredApis.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        {error
                          ? "Unable to load APIs."
                          : "No APIs found. Create an API to get started."}
                      </td>
                    </tr>
                  ) : (
                    filteredApis.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="api-name">{item.name}</div>
                          <div className="api-description">
                            {item.description}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`method ${item.method.toLowerCase()}`}
                          >
                            {item.method}
                          </span>
                        </td>

                        <td>
                          <code className="url">{item.url}</code>
                        </td>

                        <td>
                          <span className="status">
                            <span></span>
                            {item.status}
                          </span>
                        </td>

                        <td>
                          <button
                            className="action-button"
                            onClick={() =>
                              alert(
                                `API: ${item.name}\n` +
                                `Method: ${item.method}\n` +
                                `URL: ${item.url}\n` +
                                `Description: ${item.description || "None"}`
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            className="action-button"
                            onClick={() => testApi(item)}
                            disabled={testingApiId === item.id}
                          >
                            {testingApiId === item.id ? "Testing..." : "Test API"}
                          </button>

                          <button
                            className="action-button delete"
                            onClick={() => deleteApi(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {testResult && (
              <div className="create-form">
                <div className="section-heading">
                  <div>
                    <h2>API Test Result</h2>
                    <p>{testResult.apiName}</p>
                  </div>

                  <button
                    className="action-button"
                    onClick={() => setTestResult(null)}
                  >
                    Close
                  </button>
                </div>

                {testResult.error ? (
                  <p className="error-message">
                    {testResult.error}
                    {" — Status: "}
                    {testResult.status}
                  </p>
                ) : (
                  <>
                    <p>
                      <strong>HTTP Status:</strong>{" "}
                      {testResult.status}
                    </p>

                    <p>
                      <strong>Successful:</strong>{" "}
                      {testResult.success ? "Yes" : "No"}
                    </p>

                    <p>
                      <strong>Response Time:</strong>{" "}
                      {testResult.duration} ms
                    </p>

                    <h3>Response Body</h3>

                    <pre
                      style={{
                        padding: "16px",
                        background: "#111827",
                        color: "#e5e7eb",
                        borderRadius: "8px",
                        overflowX: "auto",
                        maxHeight: "400px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}
            <div className="table-footer">
              Showing {loading ? 0 : filteredApis.length} of {apis.length} APIs
            </div>
          </section>

          <footer className="footer">
            APIForge <span>·</span> Developer API Management Platform
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
