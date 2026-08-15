"use client";
import { FocusEvent, SubmitEvent, useState } from "react";
import "../../styles/google-signin.css";
import { authClient } from "../lib/auth-client";
import { emailExists, usernameExists } from "../actions/auth";
import { accountCreationValidationSchema, usernameValidation } from "@/types/shared";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface Message {
  type: "ERROR" | "INFO";
  message: string;
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameErrorMessage, setUsernameErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [message, setMessage] = useState<Message>();
  const [passwordVisibility, setPasswordVisibility] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get("usernameData");
    const email = formData.get("emailData");
    const password = formData.get("passwordData");

    if (email && password) {
      const validData = await accountCreationValidationSchema.safeParseAsync({
        username,
        password,
        email
      });
      if (validData.error) {
        setMessage({
          type: "ERROR",
          message: validData.error.message,
        })
        return;
      }
      const emailTaken = await emailExists(validData.data.email);
      if (validData.data.username) {
        const usernameTaken = await usernameExists(validData.data.username);
        if (!usernameTaken && !emailTaken) {
          const { error } = await authClient.signUp.email({
            username: validData.data.username,
            password: validData.data.password,
            email: validData.data.email,
            name: "",
          });
          if (!error) {
            setMessage({
              type: "INFO",
              message: "Verification Email Sent",
            });
            
            setVerificationEmailSent(true);
          }
        }
      } else {
        if (!emailTaken) {
          const { error } = await authClient.signUp.email({
            password: validData.data.password,
            email: validData.data.email,
            name: "",
            
          });
          if (!error) {
            setMessage({
              type: "INFO",
              message: "Verification Email Sent",
            });
            
            setVerificationEmailSent(true);
          }
        }
      }
    } else {
      if (!email) {
        setEmailErrorMessage("Email Field is Empty");
        setTimeout(() => {
          setEmailErrorMessage("");
        }, 5000);
      }
      if (!password) {
        setPasswordErrorMessage("Password Field is Empty");
        setTimeout(() => {
          setPasswordErrorMessage("");
        }, 5000);
      }
    }
  };  

  const handleUsernameOnBlur = async (e: FocusEvent<HTMLInputElement, Element>) => {
    if (e.target.value) {
      const userExists = await usernameExists(e.target.value);
      const usernameValid = await usernameValidation.safeParseAsync(e.target.value);
      if (userExists) {
        setUsernameErrorMessage("ERROR: Username Taken");
      } else if (usernameValid.error) {
        setUsernameErrorMessage(usernameValid.error.message);
      }
    }
  };

  const handleGoogleSignInClick = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/"
    });
  };

  const handleResendEmailVerification = async () => {
    if (email.length) {
      await authClient.sendVerificationEmail({
        email: email,
        callbackURL: "/",
      });
      setMessage({
        type: "INFO",
        message: "Verification Email Sent",
      });
    }
  }


  if (verificationEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] p-4 text-neutral-100 select-none">
        <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
          
          {/* Glow & Animated Icon */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner">
            <div className="absolute inset-0 rounded-2xl bg-[#e5484d]/10 blur-md pointer-events-none" />
            <svg
              className="relative h-10 w-10 text-[#e5484d]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-7.5 4.875a3.75 3.75 0 01-4 0L2.25 6.75"
              />
            </svg>
          </div>

          {/* Heading & Details */}
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#e5484d]/10 border border-[#e5484d]/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#e5484d]">
              Check Your Inbox
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Verification email sent!
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We sent a verification link to{" "}
              <span className="font-semibold text-neutral-200">{email}</span>. Click the link to complete your account setup.
            </p>
          </div>

          {/* Helpful Info Box */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 text-xs text-neutral-400 space-y-1 text-left">
            <p className="font-medium text-neutral-300">{`Didn't`} receive the email?</p>
            <ul className="list-disc pl-4 space-y-0.5 text-neutral-500">
              <li>Check your spam or junk folder.</li>
              <li>Wait a couple of minutes for delivery.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleResendEmailVerification()}
              className="w-full rounded-lg bg-[#e5484d] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#e5484d]/20 transition-all hover:bg-[#d03e43]"
            >
              Resend Email
            </button>

            <button
              type="button"
              onClick={() => setVerificationEmailSent(false)}
              className="w-full rounded-lg border border-neutral-800 bg-transparent py-2.5 text-sm font-semibold text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Back to Registration
            </button>
          </div>
          { emailErrorMessage }
        </div>
      </div>
    );
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a] p-4 text-neutral-100">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="mb-6 space-y-1 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="text-xs text-neutral-400">
            Join to create, collaborate, and share custom maps
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              name="usernameData"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user123"
              onBlur={handleUsernameOnBlur}
              onFocus={() => {
                if (usernameErrorMessage) setUsernameErrorMessage("");
              }}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d]"
            />
            {usernameErrorMessage && (
              <p className="mt-1 text-xs text-[#e5484d]">{usernameErrorMessage}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              name="emailData"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onFocus={() => {
                if (emailErrorMessage) setEmailErrorMessage("");
              }}
              required
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d]"
            />
            {emailErrorMessage && (
              <p className="mt-1 text-xs text-[#e5484d]">{emailErrorMessage}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Password
            </label>
            <div className="flex justify-between gap-5 align-middle">
              <input
                type={ passwordVisibility ? "text" : "password" }
                name="passwordData"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // onFocus={() => {
                //   if (passwordErrorMessage) setPasswordErrorMessage("");
                // }}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d]"
              />
              { !passwordVisibility ? <FaEyeSlash className="cursor-pointer" size={"2rem"} color="#e5484d" onClick={() => setPasswordVisibility(true)} /> : <FaEye className="cursor-pointer" size={"2rem"} color="#e5484d" onClick={() => setPasswordVisibility(false)} /> }
            </div>
            
            {passwordErrorMessage && (
              <p className="mt-1 text-xs text-[#e5484d]">{passwordErrorMessage}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#e5484d] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#e5484d]/20 transition-all hover:bg-[#d03e43]"
          >
            Register
          </button>
        </form>

        {/* Dynamic Status / Feedback Message */}
        {message?.message && (
          <p
            className={`mt-3 text-center text-xs font-medium ${
              message?.type === "INFO" ? "text-neutral-300" : "text-[#e5484d]"
            }`}
          >
            {message.message}
          </p>
        )}

        {/* Visual OR Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-neutral-900 px-3 text-xs uppercase text-neutral-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Auth Button */}
        <div className="flex justify-center w-full my-4">
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

        </div>

        {/* Switch to Login */}
        <p className="mt-6 text-center text-xs text-neutral-400">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-[#e5484d] hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}