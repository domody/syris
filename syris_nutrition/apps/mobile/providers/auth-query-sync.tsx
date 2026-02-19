import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";

/* 
reset the react query cache on logout or account switch
to prevent userX seeing userY's cached info for a small
period of time
*/
export function AuthQuerySync() {
    const queryClient = useQueryClient()
    const { user, loading } = useAuth()

    const lastUserIdRef = React.useRef<string | null>(null)

    React.useEffect(() => {
        if (loading) return;

        const currentUserId = user?.id ?? null
        const lastUserId = lastUserIdRef?.current
        
        // first run, no invalidation required
        if (lastUserId === null && currentUserId !== null) {
            lastUserIdRef.current = currentUserId;
            return;
        }

        // on logout or account switch
        if (lastUserId !== currentUserId) {
            // invalidate entire cache
            queryClient.clear()
            lastUserIdRef.current = currentUserId
        }
    }, [user?.id, loading, queryClient])

    return null;
}