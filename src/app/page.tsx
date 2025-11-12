import { EventCalendar } from "@/components/event-calendar";
import { loadEventDataset } from "@/lib/event-data";

export default function Home() {
  const { events, taxonomies } = loadEventDataset();

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <EventCalendar events={events} taxonomies={taxonomies} />
      </div>
    </main>
  );
}
