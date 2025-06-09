
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TrelloCard } from "./TrelloCard";
import { MetricCard } from "./MetricCard";

export default function Dashboard() {
  const [board, setBoard] = useState({
    todo: ["Task 1", "Task 2"],
    doing: ["Task 3"],
    done: ["Task 4"]
  });

  const [holidays, setHolidays] = useState<Array<{name: string, date: string}>>([]);

  useEffect(() => {
    fetch("/api/timetastic")
      .then(res => res.json())
      .then(data => setHolidays(data.upcoming || []))
      .catch(err => console.error("Failed to fetch holidays:", err));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find which column contains the active item
    const activeColumn = Object.keys(board).find(column => 
      board[column as keyof typeof board].includes(activeId as string)
    );
    
    // Find which column the item is being dropped into
    const overColumn = Object.keys(board).find(column => 
      board[column as keyof typeof board].includes(overId as string) || column === overId
    );

    if (!activeColumn || !overColumn) return;

    if (activeColumn !== overColumn) {
      // Moving between columns
      setBoard(prev => {
        const activeItems = [...prev[activeColumn as keyof typeof prev]];
        const overItems = [...prev[overColumn as keyof typeof prev]];
        
        const activeIndex = activeItems.indexOf(activeId as string);
        const overIndex = overId === overColumn ? overItems.length : overItems.indexOf(overId as string);
        
        activeItems.splice(activeIndex, 1);
        overItems.splice(overIndex, 0, activeId as string);
        
        return {
          ...prev,
          [activeColumn]: activeItems,
          [overColumn]: overItems
        };
      });
    } else {
      // Reordering within the same column
      setBoard(prev => {
        const items = [...prev[activeColumn as keyof typeof prev]];
        const activeIndex = items.indexOf(activeId as string);
        const overIndex = items.indexOf(overId as string);
        
        return {
          ...prev,
          [activeColumn]: arrayMove(items, activeIndex, overIndex)
        };
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold">Moniteye</h2>
        <nav className="space-y-2">
          <a href="/" className="block hover:underline text-blue-300">Dashboard</a>
          <a href="/about" className="block hover:underline">About</a>
          <a href="/tasks" className="block hover:underline">Tasks</a>
          <a href="/calendar" className="block hover:underline">Calendar</a>
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50 p-6 space-y-8">
        <section className="grid grid-cols-3 gap-4">
          <MetricCard title="Energy Usage" value="142 kWh" />
          <MetricCard title="Alerts" value="3 active" />
          <MetricCard title="Sensor Uptime" value="99.7%" />
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Trello-style Board</h3>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(board).map(([column, tasks]) => (
                <Card key={column} className="p-4">
                  <h4 className="font-bold capitalize mb-2">{column}</h4>
                  <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    <div>
                      {tasks.map((task) => (
                        <TrelloCard key={task} id={task} />
                      ))}
                    </div>
                  </SortableContext>
                  <Button size="sm" className="mt-2 w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Task
                  </Button>
                </Card>
              ))}
            </div>
          </DndContext>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Upcoming Holidays</h3>
          <ul className="bg-white p-4 rounded shadow">
            {holidays.map((h, i) => (
              <li key={i} className="border-b py-2">{h.name} - {h.date}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Shared Calendar</h3>
          <Calendar />
        </section>
      </main>
    </div>
  );
}
