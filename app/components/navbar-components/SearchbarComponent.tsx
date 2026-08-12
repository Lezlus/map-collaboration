import { redirect } from "next/navigation";

export function SearchBar() {

  async function search(formdata: FormData) {
    'use server'
    const searchQuery = formdata.get("search");
    // We do some action to search either for username or map name
    // Else show an error message
    if (searchQuery) {
      const stringifiedQuery = searchQuery.toString();
      redirect(`/search?query=${stringifiedQuery}`);
    }
  }

  return (
<form action={search} className="w-full max-w-md mx-auto">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      
      <div className="relative flex items-center">
        {/* Search Magnifying Glass Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
          <svg
            className="w-4 h-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          id="search"
          name="search"
          type="search"
          placeholder="Usernames or map names..."
          required
          className="w-full pl-10 pr-20 py-2 text-sm text-neutral-100 placeholder-neutral-500 bg-neutral-950/80 border border-neutral-800 rounded-xl focus:border-[#e5484d] focus:ring-1 focus:ring-[#e5484d] focus:outline-none transition-all shadow-inner"
        />

        {/* Submit Button Inside Input */}
        <button
          type="submit"
          className="absolute right-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#e5484d] hover:bg-[#d03e43] rounded-lg shadow-md shadow-[#e5484d]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#e5484d]"
        >
          Search
        </button>
      </div>
    </form>
  )
}