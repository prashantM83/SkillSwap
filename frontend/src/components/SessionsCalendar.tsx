import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Event, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Session, User } from "../types";
import {
  getSessions,
  cancelSession,
  completeSession,
  formatSessionDate,
  canJoinSession,
  isSessionSoon,
} from "../services/sessionService";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ScheduleSessionDialog from "./ScheduleSessionDialog";
import JitsiMeet from "./JitsiMeet";

// Setup date-fns localizer
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  id: string;
  session: Session;
  color: string;
}

interface SessionsCalendarProps {
  currentUser: User;
}

const statusColors: Record<string, string> = {
  scheduled: "#3b82f6", // blue
  "in-progress": "#22c55e", // green
  completed: "#6b7280", // gray
  cancelled: "#ef4444", // red
  "no-show": "#f59e0b", // orange
};

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No Show",
};

export const SessionsCalendar: React.FC<SessionsCalendarProps> = ({
  currentUser,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("calendar");

  // Dialog states
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showJitsiDialog, setShowJitsiDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch sessions
  const fetchSessionsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsData();
  }, [fetchSessionsData]);

  // Convert sessions to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return sessions.map((session) => ({
      id: session._id,
      title: session.title,
      start: new Date(session.scheduledAt),
      end: addHours(new Date(session.scheduledAt), session.duration / 60),
      session,
      color: statusColors[session.status] || "#3b82f6",
    }));
  }, [sessions]);

  // Filter sessions by status
  const upcomingSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          ["scheduled", "in-progress"].includes(s.status) &&
          new Date(s.scheduledAt) >= new Date(),
      ),
    [sessions],
  );

  const pastSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          ["completed", "cancelled", "no-show"].includes(s.status) ||
          new Date(s.scheduledAt) < new Date(),
      ),
    [sessions],
  );

  // Get partner info from session
  const getPartner = (session: Session): User | null => {
    const hostUser = session.hostUserId as User;
    const guestUser = session.guestUserId as User;
    if (!hostUser || !guestUser) return null;
    return hostUser._id === currentUser._id ? guestUser : hostUser;
  };

  // Event handlers
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedSession(event.session);
    setShowSessionDetails(true);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Cancel session handler
  const handleCancelSession = async () => {
    if (!selectedSession) return;
    setActionLoading(true);
    try {
      await cancelSession(selectedSession._id, cancelReason);
      await fetchSessionsData();
      setShowCancelDialog(false);
      setShowSessionDetails(false);
      setCancelReason("");
    } catch (err: any) {
      setError(err.message || "Failed to cancel session");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete session handler
  const handleCompleteSession = async () => {
    if (!selectedSession) return;
    setActionLoading(true);
    try {
      await completeSession(selectedSession._id);
      await fetchSessionsData();
      setShowSessionDetails(false);
    } catch (err: any) {
      setError(err.message || "Failed to complete session");
    } finally {
      setActionLoading(false);
    }
  };

  // Join Jitsi meeting
  const handleJoinJitsi = () => {
    setShowSessionDetails(false);
    setShowJitsiDialog(true);
  };

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("TODAY")}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <span className="text-lg font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("month")}
        >
          Month
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("week")}
        >
          Week
        </Button>
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("day")}
        >
          Day
        </Button>
        <Button
          variant={view === "agenda" ? "default" : "outline"}
          size="sm"
          onClick={() => onView("agenda")}
        >
          Agenda
        </Button>
      </div>
    </div>
  );

  // Render session card
  const renderSessionCard = (session: Session) => {
    const partner = getPartner(session);
    const isSoon = isSessionSoon(session.scheduledAt);
    const canJoin = canJoinSession(session.scheduledAt, session.duration);

    return (
      <Card
        key={session._id}
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          isSoon ? "border-l-4 border-l-green-500" : ""
        }`}
        onClick={() => {
          setSelectedSession(session);
          setShowSessionDetails(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{session.title}</h3>
                <Badge
                  variant={
                    session.status === "scheduled" ? "default" : "secondary"
                  }
                  style={{ backgroundColor: statusColors[session.status] }}
                  className="text-white text-xs"
                >
                  {statusLabels[session.status]}
                </Badge>
                {isSoon && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    Starting Soon!
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {formatSessionDate(session.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.duration} min
                </span>
              </div>

              {partner && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {partner.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    with {partner.name}
                  </span>
                </div>
              )}
            </div>

            {canJoin && session.status === "scheduled" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (session.meetingType === "jitsi") {
                    setSelectedSession(session);
                    handleJoinJitsi();
                  } else if (session.meetingLink) {
                    window.open(session.meetingLink, "_blank");
                  }
                }}
              >
                <Video className="w-4 h-4 mr-1" />
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            My Sessions
          </h1>
          <p className="text-gray-600">
            Manage your scheduled skill swap sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSessionsData}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  date={date}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  onSelectEvent={handleSelectEvent}
                  eventPropGetter={eventStyleGetter}
                  components={{
                    toolbar: CustomToolbar,
                  }}
                  style={{ height: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <div className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming sessions</p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowScheduleDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Your First Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingSessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <div className="space-y-4">
            {pastSessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No past sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              pastSessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedSession?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: statusColors[selectedSession.status],
                  }}
                  className="text-white"
                >
                  {statusLabels[selectedSession.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Date & Time</Label>
                  <p className="font-medium">
                    {formatSessionDate(selectedSession.scheduledAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Duration</Label>
                  <p className="font-medium">
                    {selectedSession.duration} minutes
                  </p>
                </div>
              </div>

              {selectedSession.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p>{selectedSession.description}</p>
                </div>
              )}

              {/* Partner info */}
              {(() => {
                const partner = getPartner(selectedSession);
                return (
                  partner && (
                    <div>
                      <Label className="text-gray-500">Session With</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar>
                          <AvatarFallback>
                            {partner.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          <p className="text-sm text-gray-500">
                            {partner.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Meeting info */}
              <div>
                <Label className="text-gray-500">Meeting Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedSession.meetingType === "jitsi" && (
                    <>
                      <Video className="w-4 h-4 text-blue-500" />
                      <span>Built-in Video Call (Jitsi)</span>
                    </>
                  )}
                  {selectedSession.meetingType === "external" && (
                    <>
                      <ExternalLink className="w-4 h-4 text-purple-500" />
                      <span>External Meeting Link</span>
                    </>
                  )}
                  {selectedSession.meetingType === "in-person" && (
                    <>
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>In-Person Meeting</span>
                    </>
                  )}
                </div>
              </div>

              {selectedSession.meetingLink && (
                <div>
                  <Label className="text-gray-500">Meeting Link</Label>
                  <a
                    href={selectedSession.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedSession.meetingLink}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedSession.location && (
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedSession.location}
                  </p>
                </div>
              )}

              {selectedSession.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p>{selectedSession.notes}</p>
                </div>
              )}

              {/* Action buttons */}
              {selectedSession.status === "scheduled" && (
                <DialogFooter className="flex gap-2">
                  {canJoinSession(
                    selectedSession.scheduledAt,
                    selectedSession.duration,
                  ) && (
                    <>
                      {selectedSession.meetingType === "jitsi" && (
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleJoinJitsi}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Video Call
                        </Button>
                      )}
                      {selectedSession.meetingLink && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(selectedSession.meetingLink, "_blank")
                          }
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Meeting Link
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="text-green-600"
                    onClick={handleCompleteSession}
                    disabled={actionLoading}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={actionLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to cancel this session? The other participant
            will be notified.
          </p>
          <div className="mt-4">
            <Label>Reason (optional)</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let them know why you're cancelling..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Session
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSession}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        currentUser={currentUser}
        onSessionCreated={() => {
          fetchSessionsData();
          setShowScheduleDialog(false);
        }}
      />

      {/* Jitsi Video Dialog */}
      {selectedSession && (
        <Dialog open={showJitsiDialog} onOpenChange={setShowJitsiDialog}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedSession.title}</DialogTitle>
            </DialogHeader>
            <JitsiMeet
              sessionId={selectedSession._id}
              userName={currentUser.name}
              onClose={() => setShowJitsiDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SessionsCalendar;
