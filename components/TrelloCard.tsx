
import { Card } from "@/components/ui/card";

export function TrelloCard({ id }: { id: string }) {
  return (
    <Card className="p-2 my-2 shadow-sm bg-white border">
      <div>{id}</div>
    </Card>
  );
}
