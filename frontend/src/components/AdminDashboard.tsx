import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  MessageSquare,
  AlertTriangle,
  Download,
  Send,
  CheckCircle,
  BarChart3,
  Shield,
  Settings,
  Activity,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Award,
  Star,
} from "lucide-react";
import { RootState, AppDispatch } from "../store";
import { fetchSwaps } from "../features/swaps/swapsSlice";
import {
  getAllUsersAdmin,
  createAdminMessage,
  getAdminMessages,
  type AdminMessage,
} from "../services/adminService";
import { banUser, unbanUser } from "../services/userService";
import api from "../features/auth/axiosConfig";
import type { User } from "../types";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { swaps } = useSelector((state: RootState) => state.swaps);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState<
    "info" | "warning" | "update" | "maintenance"
  >("info");
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getAllUsersAdmin();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await getAdminMessages();
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(fetchSwaps());
        await fetchUsers();
        await fetchMessages();
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleBanUser = async (userId: string, isCurrentlyBanned: boolean) => {
    setBanLoading(userId);
    try {
      if (isCurrentlyBanned) {
        await unbanUser(userId);
      } else {
        await banUser(userId);
      }
      // Refresh the users list to get updated data
      await fetchUsers();
    } catch (error) {
      console.error(
        `Failed to ${isCurrentlyBanned ? "unban" : "ban"} user:`,
        error,
      );
    } finally {
      setBanLoading(null);
    }
  };

  const handleRecalculateSwapCounts = async () => {
    setRecalculateLoading(true);
    try {
      await api.post("/admin/recalculate-swap-counts");
      await fetchUsers(); // Refresh users to show updated counts
      console.log("Swap counts recalculated successfully");
    } catch (error) {
      console.error("Failed to recalculate swap counts:", error);
    } finally {
      setRecalculateLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u && !u.isBanned).length,
    bannedUsers: users.filter((u) => u && u.isBanned).length,
    totalSwaps: swaps.length,
    pendingSwaps: swaps.filter((r) => r && r.status === "pending").length,
    completedSwaps: swaps.filter((r) => r && r.status === "completed").length,
    averageRating:
      users.length > 0
        ? users.filter((u) => u).reduce((sum, u) => sum + (u.rating || 0), 0) /
          users.filter((u) => u).length
        : 0,
  };

  const handleSendMessage = async () => {
    if (messageTitle && messageContent) {
      setMessageLoading(true);
      try {
        await createAdminMessage({
          title: messageTitle,
          content: messageContent,
          type: messageType,
        });
        setShowMessageModal(false);
        setMessageTitle("");
        setMessageContent("");
        setMessageType("info");
        // Refresh messages list
        await fetchMessages();
        // You could add a success notification here
      } catch (error) {
        console.error("Failed to send admin message:", error);
        // You could add an error notification here
      } finally {
        setMessageLoading(false);
      }
    }
  };

  const downloadReport = (type: string) => {
    let data;
    let filename;

    switch (type) {
      case "users":
        data = users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          totalSwaps: u.totalSwaps,
          rating: u.rating,
          joinDate: u.joinDate,
          isBanned: u.isBanned,
        }));
        filename = "users-report.json";
        break;
      case "swaps":
        data = swaps;
        filename = "swaps-report.json";
        break;
      default:
        return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="text-gray-500 mb-4">Loading admin dashboard...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-gray-600">
          Manage users, monitor activity, and oversee platform operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users size={16} />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center space-x-2">
            <MessageSquare size={16} />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center space-x-2">
            <Settings size={16} />
            <span>Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.totalUsers}</div>
                <p className="text-xs text-gray-600">
                  {stats.activeUsers} active, {stats.bannedUsers} banned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Swaps</CardTitle>
                <Activity className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.totalSwaps}</div>
                <p className="text-xs text-gray-600">
                  {stats.pendingSwaps} pending, {stats.completedSwaps} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs text-gray-600">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Platform Health</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">Good</div>
                <p className="text-xs text-gray-600">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {swaps.slice(0, 5).map((swap) => (
                  <div key={swap._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-200 text-gray-900 text-xs">
                        {typeof swap.fromUserId === 'string' ? 'U' : swap.fromUserId?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        New swap request: {swap.skillOffered} ↔ {swap.skillWanted}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={swap.status === 'pending' ? 'secondary' : 'default'}>
                      {swap.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Swaps</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-200 text-gray-900 text-xs">
                              {user.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-600">
                              Joined {new Date(user.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>{user.totalSwaps}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span>{user.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive" className="flex items-center space-x-1">
                            <UserX size={12} />
                            <span>Banned</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center space-x-1">
                            <UserCheck size={12} />
                            <span>Active</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={user.isBanned ? "default" : "destructive"}
                          onClick={() => handleBanUser(user._id, user.isBanned)}
                          disabled={banLoading === user._id}
                        >
                          {banLoading === user._id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span>{user.isBanned ? "Unban" : "Ban"}</span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Admin Messages</h3>
            <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Send Message</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Send Admin Message</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="message-title">Title</Label>
                    <Input
                      id="message-title"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                      placeholder="Message title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message-type">Type</Label>
                    <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message-content">Content</Label>
                    <Textarea
                      id="message-content"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Message content"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage} disabled={messageLoading || !messageTitle || !messageContent}>
                    {messageLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Send size={16} className="mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{message.title}</h4>
                      <Badge variant="secondary">{message.type}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{message.content}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download size={20} />
                  <span>Export Reports</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => downloadReport("users")}
                  className="w-full justify-start"
                >
                  <Users size={16} className="mr-2" />
                  Export Users Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadReport("swaps")}
                  className="w-full justify-start"
                >
                  <Activity size={16} className="mr-2" />
                  Export Swaps Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings size={20} />
                  <span>System Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleRecalculateSwapCounts}
                  disabled={recalculateLoading}
                  className="w-full justify-start"
                >
                  {recalculateLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-2" />
                  ) : (
                    <Award size={16} className="mr-2" />
                  )}
                  Recalculate Swap Counts
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
