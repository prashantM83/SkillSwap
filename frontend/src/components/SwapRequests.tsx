import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import {
  fetchSwaps,
  createSwap,
  updateSwap,
  deleteSwap,
} from "../features/swaps/swapsSlice";
import { User } from "../types";
import { getAllUsers } from "../services/userService";
import {
  MessageSquare,
  Plus,
  Check,
  X,
  Trash2,
  Clock,
  Search,
  Calendar,
  Award,
  AlertCircle,
} from "lucide-react";
// shadcn/ui imports
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SwapRequestsProps {
  currentUser: User;
}

export const SwapRequests: React.FC<SwapRequestsProps> = ({ currentUser }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { swaps } = useSelector(
    (state: RootState) => state.swaps,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    toUserId: "",
    skillOffered: "",
    skillWanted: "",
    message: "",
  });

  useEffect(() => {
    dispatch(fetchSwaps());
    // Fetch users for the form
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, [dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(createSwap({
      fromUserId: currentUser._id,
      toUserId: form.toUserId,
      skillOffered: form.skillOffered,
      skillWanted: form.skillWanted,
      message: form.message,
    }));
    setShowForm(false);
    setForm({ toUserId: "", skillOffered: "", skillWanted: "", message: "" });
  };

  const handleUpdate = (id: string, status: string) => {
    dispatch(updateSwap({ id, status }));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteSwap(id));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "accepted":
        return <Check size={16} />;
      case "rejected":
        return <X size={16} />;
      case "completed":
        return <Award size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const filteredSwaps = swaps.filter((swap) => {
    if (!swap) return false;
    
    const fromUserId = typeof swap.fromUserId === 'string' ? swap.fromUserId : swap.fromUserId?._id;
    const toUserId = typeof swap.toUserId === 'string' ? swap.toUserId : swap.toUserId?._id;
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "sent" && fromUserId === currentUser._id) ||
      (activeTab === "received" && toUserId === currentUser._id) ||
      (activeTab === "pending" && swap.status === "pending");

    const matchesSearch = 
      searchTerm === "" ||
      swap.skillOffered.toLowerCase().includes(searchTerm.toLowerCase()) ||
      swap.skillWanted.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: "all", label: "All Swaps", count: swaps.length },
    { id: "sent", label: "Sent", count: swaps.filter(s => {
      const fromUserId = typeof s?.fromUserId === 'string' ? s.fromUserId : s?.fromUserId?._id;
      return fromUserId === currentUser._id;
    }).length },
    { id: "received", label: "Received", count: swaps.filter(s => {
      const toUserId = typeof s?.toUserId === 'string' ? s.toUserId : s?.toUserId?._id;
      return toUserId === currentUser._id;
    }).length },
    { id: "pending", label: "Pending", count: swaps.filter(s => s?.status === "pending").length },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shadow-sm">
            <MessageSquare size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
          My Swap Requests
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage your skill exchange requests and track your learning journey
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <Input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus size={20} />
                  <span>New Request</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Swap Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="toUserId">Select User</Label>
                    <Select value={form.toUserId} onValueChange={(value) => setForm({...form, toUserId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => user._id !== currentUser._id && user.isPublic && !user.isBanned)
                          .map(user => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skillWanted">Skill I want to learn</Label>
                    <Input
                      id="skillWanted"
                      name="skillWanted"
                      value={form.skillWanted}
                      onChange={handleInputChange}
                      placeholder="What skill do you want to learn?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skillOffered">Skill I can offer</Label>
                    <Input
                      id="skillOffered"
                      name="skillOffered"
                      value={form.skillOffered}
                      onChange={handleInputChange}
                      placeholder="What skill can you teach?"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleInputChange}
                      placeholder="Add a personal message..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!form.toUserId || !form.skillOffered || !form.skillWanted}>
                      Send Request
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Swaps List */}
      <div className="space-y-4">
        {filteredSwaps.map((swap) => {
          if (!swap) return null;
          
          const fromUserId = typeof swap.fromUserId === 'string' ? swap.fromUserId : swap.fromUserId?._id;
          const isSentByMe = fromUserId === currentUser._id;
          const otherUser = isSentByMe ? swap.toUserId : swap.fromUserId;
          const otherUserName = typeof otherUser === 'string' ? 'Unknown User' : otherUser?.name || 'Unknown User';
          
          return (
            <Card key={swap._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gray-100 text-gray-900">
                        {otherUserName[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
                        <Badge variant={getStatusVariant(swap.status)} className="flex items-center space-x-1">
                          {getStatusIcon(swap.status)}
                          <span className="capitalize">{swap.status}</span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">You want to learn:</p>
                          <Badge variant="outline" className="bg-gray-100">
                            {swap.skillWanted}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">You're offering:</p>
                          <Badge variant="outline" className="bg-gray-100">
                            {swap.skillOffered}
                          </Badge>
                        </div>
                      </div>
                      {swap.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">{swap.message}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>{new Date(swap.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {swap.status === "pending" && !isSentByMe && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(swap._id, "accepted")}
                          className="flex items-center space-x-1"
                        >
                          <Check size={16} />
                          <span>Accept</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(swap._id, "rejected")}
                          className="flex items-center space-x-1"
                        >
                          <X size={16} />
                          <span>Reject</span>
                        </Button>
                      </>
                    )}
                    {swap.status === "accepted" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(swap._id, "completed")}
                        className="flex items-center space-x-1"
                      >
                        <Award size={16} />
                        <span>Mark Complete</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(swap._id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSwaps.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 mb-4">No swap requests found</div>
            <Button onClick={() => setShowForm(true)}>
              Create your first swap request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};