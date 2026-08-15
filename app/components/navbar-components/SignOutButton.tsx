"use client";
import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const logoutButtonClick = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        }
      }
    })
  }

  return (
    <div>
      <button onClick={() => logoutButtonClick()} className="px-3 py-1.5 text-sm font-medium text-white hover:text-[#e5484d] hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all">
        Sign Out
      </button>
    </div>
  )

}