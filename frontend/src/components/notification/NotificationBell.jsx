import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useGetNotificationsQuery, useMarkReadMutation } from "@/features/apis/notificationsApi";
import { useMeQuery } from "@/features/apis/authApi";

export default function NotificationBell() {

  // const token = useAppSelector((state) => state.user.token);
  // const { data: meData } = useMeQuery(undefined, { skip: !token });
  const { data: meData } = useMeQuery();
  const user = meData?.user || {};

  const userId = user?._id || user?.id;
  const { data: notes = [] } = useGetNotificationsQuery({ userId }, { skip: !userId });
  const [markRead] = useMarkReadMutation();
  const [open, setOpen] = useState(false);

  const unread = (notes?.filter(n => !n.isRead).length) || 0;

  const handleMarkRead = async (id) => {
    await markRead(id).unwrap();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-full hover:bg-gray-100">
        <Bell />
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">{unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow z-50">
          <div className="p-3 flex justify-between items-center border-b">
            <strong>Notifications</strong>
            <button onClick={() => setOpen(false)} className="text-sm">Close</button>
          </div>
          <div className="max-h-64 overflow-auto">
            {notes.length === 0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
            {notes.map(n => (
              <div key={n._id} className={`p-3 border-b ${n.isRead ? "bg-white" : "bg-gray-50"}`}>
                <div className="flex justify-between">
                  <div className="text-sm">{n.title}</div>
                  {!n.isRead && <button className="text-xs text-blue-600" onClick={() => handleMarkRead(n._id)}>Mark read</button>}
                </div>
                <div className="text-xs text-gray-600">{n.body}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
