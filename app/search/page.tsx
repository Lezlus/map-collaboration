import { search } from "../actions/search";

export default async function Search(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const params = await props.searchParams;
  const query = params?.query || "";

  const correctedQuery = await search(query);
  console.log(correctedQuery);
  return (
    <div>
      <h1 className="text-white">Some Search Page With Search Params</h1>
    </div>
  )
}