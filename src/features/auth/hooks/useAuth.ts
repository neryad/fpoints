import { useState } from "react";
import {
  signInWithEmail,
  signInWithUsername,
  signUpWithEmail,
  setupChildAccount,
} from "../services/auth.service";

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

  async function signInAsChild(
    username: string,
    pin: string,
  ): Promise<boolean> {
    try {
      setError("");
      setIsLoading(true);
      await signInWithUsername(username, pin);
      return true;
    } catch (err) {
      // "notFound" means no account yet — let caller try invitation activation silently
      if (err instanceof Error && (err as any).notFound) {
        return false;
      }
      setError(
        err instanceof Error ? err.message : "Usuario o PIN incorrecto.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function setupChild(
    username: string,
    pin: string,
  ): Promise<{ groupId: string } | null> {
    try {
      setError("");
      setIsLoading(true);
      return await setupChildAccount(username, pin);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo configurar la cuenta.",
      );
      return null;
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
    signInAsChild,
    setupChild,
  };
}
