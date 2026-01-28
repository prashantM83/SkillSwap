import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Search,
  Filter,
  Star,
  MapPin,
  MessageCircle,
  Clock,
  Award,
  Sparkles,
} from "lucide-react";
import type { User } from "../types";
import { AppDispatch } from "../store";
import { createSwap } from "../features/swaps/swapsSlice";
import { getAllUsers } from "../services/userService";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SkillBrowserProps {
  currentUser: User;
}

export const SkillBrowser: React.FC<SkillBrowserProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [mySkillToOffer, setMySkillToOffer] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    if (user._id === currentUser._id || !user.isPublic || user.isBanned)
      return false;

    const matchesSearch =
      searchTerm === "" ||
      user.skillsOffered.some((skill: string) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "available" && user.availability.length > 0) ||
      (selectedFilter === "highly-rated" && user.rating >= 4.5);

    return matchesSearch && matchesFilter;
  });

  const handleRequestSwap = () => {
    if (selectedUser && selectedSkill && mySkillToOffer) {
      dispatch(
        createSwap({
          fromUserId: currentUser._id,
          toUserId: selectedUser._id,
          skillOffered: mySkillToOffer,
          skillWanted: selectedSkill,
          message: requestMessage,
        }),
      );
      setSelectedUser(null);
      setSelectedSkill("");
      setMySkillToOffer("");
      setRequestMessage("");
    }
  };

  const openRequestModal = (user: User, skill: string) => {
    setSelectedUser(user);
    setSelectedSkill(skill);
  };

  const handleViewProfile = (user: User) => {
    navigate(`/profile/${user._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading amazing skills...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center space-x-2 mb-4">
          <Sparkles className="text-gray-600" size={32} />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black">
            Discover Amazing Skills
          </h1>
          <Sparkles className="text-gray-600" size={32} />
        </div>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Connect with talented individuals and exchange knowledge in a vibrant learning community
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search skills, names, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="text-gray-500" size={20} />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="highly-rated">Highly Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {filteredUsers.map((user) => (
          <Card key={user._id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-gray-100 text-gray-900 text-lg">
                    {user.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:text-black transition-colors">
                    {user.name}
                  </CardTitle>
                  {user.location && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="font-bold text-gray-900">{user.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Award size={16} className="text-gray-600" />
                    <span className="font-bold text-gray-900">{user.totalSwaps}</span>
                  </div>
                  <div className="text-xs text-gray-600">Swaps</div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Skills Offered</h4>
                <div className="flex flex-wrap gap-2">
                  {user.skillsOffered.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-900">
                      {skill}
                    </Badge>
                  ))}
                  {user.skillsOffered.length > 3 && (
                    <Badge variant="outline" className="text-gray-600">
                      +{user.skillsOffered.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Availability */}
              {user.availability.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>Available: {user.availability.join(", ")}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewProfile(user)}
                  className="flex-1"
                >
                  View Profile
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => openRequestModal(user, user.skillsOffered[0])}
                      className="flex-1"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Request Swap
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Request Skill Swap</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="skill-wanted">Skill I want to learn</Label>
                        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {user.skillsOffered.map((skill, index) => (
                              <SelectItem key={index} value={skill}>
                                {skill}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="skill-offered">Skill I can offer</Label>
                        <Input
                          id="skill-offered"
                          value={mySkillToOffer}
                          onChange={(e) => setMySkillToOffer(e.target.value)}
                          placeholder="What skill can you teach?"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Message (optional)</Label>
                        <Textarea
                          id="message"
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          placeholder="Introduce yourself and explain what you're looking for..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setSelectedUser(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRequestSwap} disabled={!selectedSkill || !mySkillToOffer}>
                        Send Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No users found matching your criteria</div>
          <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setSelectedFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};