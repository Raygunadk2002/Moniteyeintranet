
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Plus } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TrelloCard } from "@/components/TrelloCard";
import { MetricCard } from "@/components/MetricCard";

export default function Dashboard() {
  const [board, setBoard] = useState({
    todo: ["Task 1", "Task 2"],
    doing: ["Task 3"],
    done: ["Task 4"]
  });

  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetch("/api/timetastic")
      .then(res => res.json())
      .then(data => setHolidays(data.upcoming || []));
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold">Moniteye</h2>
        <nav className="space-y-2">
          <a href="#" className="block hover:underline">Dashboard</a>
          <a href="#" className="block hover:underline">Task Board</a>
          <a href="#" className="block hover:underline">Holidays</a>
          <a href="#" className="block hover:underline">Calendar</a>
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
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(board).map(([column, tasks]) => (
              <Card key={column} className="p-4">
                <h4 className="font-bold capitalize mb-2">{column}</h4>
                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                  {tasks.map((task, index) => (
                    <TrelloCard key={task} id={task} />
                  ))}
                </SortableContext>
                <Button size="sm" className="mt-2 w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Task
                </Button>
              </Card>
            ))}
          </div>
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
