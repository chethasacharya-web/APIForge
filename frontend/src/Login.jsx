import { useState } from "react";
import api from "./services/api";
import "./Login.css";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await api.post("/auth/register", {
          name: name.trim(),
          email: email.trim(),
          password,
        });

        setSuccess(
          response.data.message || "Account created! Please sign in."
        );

        setIsRegister(false);
        setName("");
        setPassword("");
      } else {
        const response = await api.post("/auth/login", {
          email: email.trim(),
          password,
        });

        localStorage.setItem("token", response.data.token);
        onLogin(response.data.user);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isRegister
            ? "Registration failed. Please try again."
            : "Login failed. Check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">A</div>

        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>

        <p className="login-subtitle">
          {isRegister
            ? "Register to start managing your APIs."
            : "Sign in to manage your APIs."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
            </>
          )}

          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 8 : undefined}
            required
          />

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <p className="login-switch">
          {isRegister ? "Already have an account?" : "New to APIForge?"}{" "}
          <button
            type="button"
            className="login-link"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
              setPassword("");
            }}
            disabled={loading}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>

        <p className="login-note">
          APIForge · Developer API Management
        </p>
      </section>
    </main>
  );
}

export default Login;