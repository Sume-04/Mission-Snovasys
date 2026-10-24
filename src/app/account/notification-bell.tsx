
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  user_id: string;
  document_id: string | null;
  actor_id: string | null;
  type: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please sign in to view notifications.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("notifications")
      .select(
        "id, user_id, document_id, actor_id, type, message, is_read, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (queryError) {
      setError("Unable to load notifications.");
      setLoading(false);
      return;
    }

    const items = (data ?? []) as NotificationItem[];

    setNotifications(items);
    setUnreadCount(items.filter((item) => !item.is_read).length);
    setLoading(false);
    setError("");
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    const supabase = createSupabaseBrowserClient();

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (updateError) {
      setError("Unable to mark notification as read.");
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const markAllAsRead = async () => {
    const supabase = createSupabaseBrowserClient();

    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (updateError) {
      setError("Unable to mark notifications as read.");
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setError("");
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
      >
        ♧

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0B1020] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <h3 className="font-semibold text-white">Notifications</h3>
              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Loading notifications...
              </p>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-red-300">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl">♧</p>
                <p className="mt-3 text-sm font-medium text-white">
                  You’re all caught up
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  New document shares will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-4 transition ${
                      notification.is_read
                        ? "bg-transparent"
                        : "bg-cyan-400/[0.04]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                        ↗
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-5 text-slate-200">
                          {notification.message ||
                            "A document was shared with you."}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          {notification.document_id && (
                            <Link
                              href="/account"
                              onClick={() => {
                                if (!notification.is_read) {
                                  void markAsRead(notification.id);
                                }
                                setIsOpen(false);
                              }}
                              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                            >
                              View shared documents
                            </Link>
                          )}

                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(notification.id)
                              }
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>

                      {!notification.is_read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                void loadNotifications();
              }}
              className="w-full text-center text-xs text-slate-400 transition hover:text-cyan-300"
            >
              Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}