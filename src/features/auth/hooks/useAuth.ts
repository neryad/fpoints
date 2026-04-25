import { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "../services/auth.service";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function clearError() {
    setError("");
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      setError("");
      setIsLoading(true);
      await signInWithEmail(email, password);
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al iniciar sesión.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string): Promise<boolean> {
    try {
      setError("");
      setIsLoading(true);
      await signUpWithEmail(email, password);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error al registrarse.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    clearError,
    signIn,
    signUp,
  };
}
