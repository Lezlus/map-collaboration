"use client";
import { SubmitEvent, useState } from "react";
import "../../styles/google-signin.css";
import { authClient } from "../lib/auth-client";
import { loginValidationSchema } from "@/types/shared";

interface Message {
  type: "ERROR" | "INFO";
  message: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<Message>();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get("email_data");
    const password = formData.get("password_data");
    const rememberMe = formData.get("remember_me_data")
    const validData = await loginValidationSchema.safeParseAsync({
      email,
      password,
      rememberMe,
    });
    if (validData.error) {
      setMessage({ type: "ERROR", message: validData.error.message });
    } else {
      const rememberCredentials = validData.data.rememberMe === "on";
      const { error } = await authClient.signIn.email({
        email: validData.data.email,
        password: validData.data.password,
        rememberMe: rememberCredentials,
        callbackURL: "/",
      });
      if (error) {
        setMessage({ type: "ERROR", message: error.message ?? "Some Error Occurred when signing in" });
      }
    }
  }

  const handleGoogleSignInClick = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });

  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl p-8 shadow-xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email_data"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password_data"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="*********"
              required
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Sign In
          </button>
          <div className="flex justify-between py-4">
            <label className="mb-1.5 block text-sm font-medium text-white dark:text-gray-300">
              Remember Me?
            </label>
            <input type="checkbox" name="remember_me_data" />
          </div>
        </form>
        <p className={ message?.type === "INFO" ? "text-blue-400" : "text-red-600" }>{ message?.message }</p>
        <button className="gsi-material-button" onClick={handleGoogleSignInClick}>
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">Sign in with Google</span>
            <span style={{ display: "none" }}>Sign in with Google</span>
          </div>
        </button>
        <p className="mt-6 text-center text-sm text-white dark:text-gray-400">
          Dont have an account?{' '}
          <a href="#register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}