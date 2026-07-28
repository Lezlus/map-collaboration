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
    <form action={search} className="max-w md mx-auto">
      <label htmlFor="search" className="block mb-2.5 text-sm font-medium text-heading sr-only">Search</label>
      <div className="flex searchbar-container">
        <div className="inset-y-0 inset-s-0 flex items-center ps-3 pointer-events-none">
            <svg className="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg>
        </div>
        <input id="search"  name="search" className="block w-full p-3 ps-9 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" type="search" placeholder="usernames or map names..." required />
        <div className="search-submit-button-wrapper">
          <button className="inset-e-1.5 bottom-1.5 text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded text-xs px-3 py-1.5 focus:outline-none" type="submit">Search</button>
        </div>
      </div>
    </form>
  )
}