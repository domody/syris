import { useQuery } from "@tanstack/react-query"
import { getVectorMemories } from "@/lib/api"

export const useVectorMemories = () => {
    return useQuery({
        queryKey: ["vectors"],
        queryFn: getVectorMemories
    })
}