// src/app/(app)/my-tasks/page.tsx
import { requireSession } from "@/lib/session";
import { getMyTasks } from "@/lib/task-queries";
import { MyTasksClient } from "./my-tasks-client";

export default async function MyTasksPage() {
  const me = await requireSession();
  const tasks = await getMyTasks(me.orgId, me.id);

  return <MyTasksClient tasks={JSON.parse(JSON.stringify(tasks))} meName={me.name ?? "you"} />;
}