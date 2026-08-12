
import Link from "next/link"
import { auth } from "@/app/lib/auth"
import { headers } from "next/headers"
import { SearchBar } from "./navbar-components/SearchbarComponent";
import { authClient } from "../lib/auth-client";
import CreateNewMapButton from "./navbar-components/CreateNewMapButton";
import SignOutButton from "./navbar-components/SignOutButton";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers()
  });


  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md text-neutral-100 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Website Logo / Title */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="h-3 w-3 rounded-full bg-[#e5484d] group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold tracking-tight text-white group-hover:text-[#e5484d] transition-colors">
              Map Collaboration
            </h2>
          </Link>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <SearchBar />
        </div>

        {/* Right Section: Auth & Action Navigation */}
        <div className="flex items-center gap-3 shrink-0">
          {!session ? (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="px-3.5 py-1.5 text-sm font-semibold text-white hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="px-3.5 py-1.5 text-sm font-semibold text-white bg-[#e5484d] hover:bg-[#d03e43] rounded-lg shadow-md shadow-[#e5484d]/20 transition-all">
                  Register
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Create Map Button */}
              <CreateNewMapButton />

              {/* Your Creations Link */}
              <Link
                href="/your-creations"
                className="px-3 py-1.5 text-sm font-medium text-white hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors"
              >
                Your Creations
              </Link>

              {/* Sign Out Button */}
              <SignOutButton />
            </div>
          )}
        </div>

      </div>

      {/* Mobile Search Bar Row (renders below main header on small screens) */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  )
}