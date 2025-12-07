import { useVectorMemories } from "@/hooks/use-memories";

export function MemoryContextTab() {
  const { data, isLoading, error } = useVectorMemories();

  if (isLoading) return;
  if (error) return;

  const vector_memories = data;

  return (
    <div className="flex flex-col space-y-2 p-4 overflow-y-auto">
      {vector_memories ? (
        vector_memories.map((memory) => (
          <div key={memory.id} className="">
            {memory.text}
          </div>
        ))
      ) : (
        <div className="">Loading...</div>
      )}
    </div>
  );
}
