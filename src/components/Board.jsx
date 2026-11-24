import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Column from "./Column.jsx";
import { TaskCardBody } from "./TaskCard.jsx";
import { COLUMNS } from "../lib/constants.js";

export default function Board({ tasks, visibleTasks, filtering, onMove, onOpen, onAdd }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    // A small distance threshold lets a plain click open the task.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const activeTask = tasks.find((t) => t.id === activeId);

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.status !== over.id) onMove(task, over.id);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={visibleTasks.filter((t) => t.status === col.id)}
            totalInColumn={tasks.filter((t) => t.status === col.id).length}
            filtering={filtering}
            onOpen={onOpen}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {activeTask ? <TaskCardBody task={activeTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
