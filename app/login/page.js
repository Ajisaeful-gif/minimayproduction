"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Field,
  TextInput
} from "@/components/ui";
import { resolveLandingPath } from "@/lib/auth";
import { useAuth } from "@/components/auth-provider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authEnabled, authError, loading, role, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authEnabled) {
      router.replace("/dashboard");
      return;
    }

    if (!loading && session && role) {
      const nextPath = searchParams.get("next");
      router.replace(nextPath || resolveLandingPath(role));
    }
  }, [authEnabled, loading, role, router, searchParams, session]);

  if (!authEnabled) {
    return (
      <div className="auth-state-shell">
        <div className="auth-state-card">
          <p className="section-title">Guest Mode</p>
          <h1 className="page-title" style={{ marginTop: "8px" }}>
            Login sementara dinonaktifkan
          </h1>
          <p className="page-description">
            Anda akan diarahkan langsung ke dashboard tanpa proses login.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setFormError("Email dan password wajib diisi.");
      return;
    }

    setFormError("");
    const result = await signIn({
      email: email.trim(),
      password
    });

    if (result?.error) {
      setFormError(result.error.message);
      return;
    }

    router.replace(result?.data?.redirectTo ?? "/dashboard");
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel auth-panel-minimal">
        <form className="login-minimal-form" onSubmit={handleSubmit}>
          <Field
            badge={{ label: "Wajib", variant: "manual" }}
            full
            label="Email"
            required
          >
            <TextInput
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@minimay.com"
              type="email"
              value={email}
            />
          </Field>

          <Field
            badge={{ label: "Wajib", variant: "manual" }}
            full
            label="Password"
            required
          >
            <TextInput
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              type="password"
              value={password}
            />
          </Field>

          {formError || authError ? (
            <div className="auth-error-box">{formError || authError}</div>
          ) : null}

          <div className="auth-actions">
            <Button disabled={loading} type="submit" variant="primary">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-state-shell">
          <div className="auth-state-card">
            <p className="section-title">Memuat Login</p>
            <h1 className="page-title" style={{ marginTop: "8px" }}>
              Menyiapkan form masuk
            </h1>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
