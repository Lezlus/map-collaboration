import Link from "next/link"
import { auth } from "@/app/lib/auth"
import { headers } from "next/headers"
import { SearchBar } from "./navbar-components/SearchbarComponent";
import CreateNewMapButton from "./navbar-components/CreateNewMapButton";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const logoutButtonClick = async () => {
    await auth.api.signOut();
  }

  return (
    <div className="flex gap-9 justify-between py-4 items-center navbar">
      {/* Website Name */}
      <div className="p-2.5 mx-0.5">
        <h2>Map Collaboration</h2>
      </div>
      {/* Login/Register Section */}
      <div className="flex gap-4 mx-0.5 justify-between px-1">
        {!session ? (
          <>
            <Link href="/login">
              <button>Login</button>
            </Link>
            <Link href="/register">
              <button>Register</button>
            </Link>
          </>
        ) :
          (
            <>
              <SearchBar />
              <CreateNewMapButton />
              <Link href={"/your-creations"}>
                <span>Your Creations</span>
              </Link>
              <div>
                <button>Sign Out</button>
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}