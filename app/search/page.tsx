
interface SearchParamsType {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
export default async function Search({ searchParams }: SearchParamsType) {
  const params = await searchParams;
  console.log(params);

  return (
    <div>
      <h1 className="text-white">Some Search Page With Search Params</h1>
    </div>
  )
}