import { useEffect, useMemo, useState } from "react";

export default function useAdminSearch<T>(
  data: T[],
  keys: (keyof T)[],
  delay: number = 300
){
  const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(()=>{
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay);
    return ()=> clearTimeout(handler)
  }, [query, delay]);

  // Filter Logic
  const filtered = useMemo(()=>{
    if(!debouncedQuery.trim()) return data;
    const lower = debouncedQuery.toLocaleLowerCase();
    
    return data.filter((item)=>
      keys.some((key)=>{
        const value = item[key];
        return(
          typeof value === "string" && value.toLocaleLowerCase().includes(lower)
        )
      })
    )

  },[debouncedQuery, data, keys])

  return{
    query,
    setQuery,
    filtered,
    isEmpty: filtered.length === 0
  }
}