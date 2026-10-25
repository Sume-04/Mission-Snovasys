
"use client";

import { useEffect, useState } from "react";

type AuditEvent = {
  id: string;
  actor_id: string;
  document_id: string | null;
  action: string;
  outcome: string;
  request_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    async function loadActivity() {
      try {
        const response = await fetch("/api/admin/activity", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load activity.");
        }

        setEvents(result.events ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load activity.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, []);

  const filteredEvents =
    actionFilter === "all"
      ? events
      : events.filter((event) => event.action === actionFilter);

  if (loading) {
    return <main className="p-8">Loading activity...</main>;
  }

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Admin Activity</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Activity Dashboard</h1>
        <p className="mt-2 text-gray-500">
          Review recent document activity and permission changes.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="action-filter" className="font-medium">
          Filter by action:
        </label>

        <select
          id="action-filter"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="rounded-md border px-3 py-2"
        >
          <option value="all">All actions</option>
          <option value="upload">Upload</option>
          <option value="view">View</option>
          <option value="download">Download</option>
          <option value="share">Share</option>
          <option value="revoke">Revoke</option>
          <option value="delete">Delete</option>
          <option value="update">Update</option>
        </select>

        <span className="text-sm text-gray-500">
          {filteredEvents.length} events
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Document ID</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="whitespace-nowrap px-4 py-3">
                  {new Date(event.created_at).toLocaleString()}
                </td>

                <td className="px-4 py-3">
                  <span className="font-mono text-xs">
                    {event.actor_id}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className="font-mono text-xs">
                    {event.document_id ?? "—"}
                  </span>
                </td>

                <td className="px-4 py-3 capitalize">
                  {event.action}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={
                      event.outcome === "success"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {event.outcome}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <pre className="max-w-xs overflow-auto whitespace-pre-wrap text-xs">
                    {JSON.stringify(event.metadata ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No activity found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
