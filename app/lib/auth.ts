import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sendMail } from '@/services/mailService';
import { after } from 'next/server';
import { jwt } from 'better-auth/plugins';

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    }
  },
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwt",
      refreshCache: false,
    }
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  baseURL: process.env.BETTER_AUTH_URL,
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      after(async () => {
        try {
          await sendMail(user.email, "Verify Your Email", `Click On The Following Link To Verify Your Email ${url}. Your account will be deleted in 3 days if you don't verify`);
        } catch (err) {
          console.log("Background email failed", err);
        }
      })
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      name: {
        type: "string",
        required: false,
      },
    },
    
  }
});
