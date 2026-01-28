import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Star,
  Edit2,
  Save,
  X,
  Plus,
  Loader2,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { updateUserProfile } from "../features/auth/authSlice";
import type { User as UserType } from "../types";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface UserProfileProps {
  user: UserType;
  onUpdateUser?: (user: UserType) => void;
  isOwnProfile: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdateUser,
  isOwnProfile,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newSkillOffered, setNewSkillOffered] = useState("");
  const [newSkillWanted, setNewSkillWanted] = useState("");

  // Update editedUser when user prop changes
  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleSave = async () => {
    try {
      const userId = user._id;
      if (!userId) {
        console.error("No user ID found");
        return;
      }

      await dispatch(
        updateUserProfile({
          userId,
          userData: editedUser,
        }),
      ).unwrap();

      setIsEditing(false);
      if (onUpdateUser) {
        onUpdateUser(editedUser);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const addSkill = (type: "offered" | "wanted") => {
    const newSkill = type === "offered" ? newSkillOffered : newSkillWanted;
    if (newSkill.trim()) {
      const skillsKey = type === "offered" ? "skillsOffered" : "skillsWanted";
      setEditedUser({
        ...editedUser,
        [skillsKey]: [...editedUser[skillsKey], newSkill.trim()],
      });
      if (type === "offered") setNewSkillOffered("");
      else setNewSkillWanted("");
    }
  };

  const removeSkill = (type: "offered" | "wanted", index: number) => {
    const skillsKey = type === "offered" ? "skillsOffered" : "skillsWanted";
    setEditedUser({
      ...editedUser,
      [skillsKey]: editedUser[skillsKey].filter(
        (_: string, i: number) => i !== index,
      ),
    });
  };

  const availabilityOptions = [
    "Weekdays",
    "Weekends",
    "Evenings",
    "Mornings",
    "Flexible",
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-16">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-gray-500 mx-auto mb-4" />
              <span className="text-lg text-gray-600">Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Card>
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="rounded-t-lg rounded-b-none">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <CardHeader className="bg-black text-white pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarFallback className="bg-gray-100 text-gray-900 text-2xl">
                  {user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl mb-2 text-white">
                  {user.name}
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-300">
                  {user.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                <Edit2 size={20} />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Stats */}
        <CardContent className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Award className="text-gray-600" size={24} />
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {user.totalSwaps}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600">Swaps Completed</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Star size={24} className="text-yellow-500 fill-current" />
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {user.rating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600">Average Rating</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="text-gray-600" size={24} />
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {user.skillsOffered.length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600">Skills Offered</div>
            </div>
          </div>
        </CardContent>

        {/* Profile Content */}
        <CardContent className="p-6 space-y-6">
          {/* Skills Offered */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills Offered</h3>
              {isOwnProfile && isEditing && (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSkillOffered}
                    onChange={(e) => setNewSkillOffered(e.target.value)}
                    placeholder="Add a skill"
                    className="w-48"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill('offered')}
                  />
                  <Button size="sm" onClick={() => addSkill('offered')}>
                    <Plus size={16} />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {editedUser.skillsOffered.map((skill, index) => (
                <Badge key={index} variant="secondary" className="bg-gray-200 text-gray-900">
                  {skill}
                  {isOwnProfile && isEditing && (
                    <button
                      onClick={() => removeSkill('offered', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Skills Wanted */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills Wanted</h3>
              {isOwnProfile && isEditing && (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newSkillWanted}
                    onChange={(e) => setNewSkillWanted(e.target.value)}
                    placeholder="Add a skill"
                    className="w-48"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill('wanted')}
                  />
                  <Button size="sm" onClick={() => addSkill('wanted')}>
                    <Plus size={16} />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {editedUser.skillsWanted.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-gray-700">
                  {skill}
                  {isOwnProfile && isEditing && (
                    <button
                      onClick={() => removeSkill('wanted', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Availability */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
            <div className="flex flex-wrap gap-2">
              {editedUser.availability.map((time, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  <Clock size={12} className="mr-1" />
                  {time}
                </Badge>
              ))}
            </div>
            {isOwnProfile && isEditing && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700">Add availability:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availabilityOptions.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!editedUser.availability.includes(option)) {
                          setEditedUser({
                            ...editedUser,
                            availability: [...editedUser.availability, option],
                          });
                        }
                      }}
                      disabled={editedUser.availability.includes(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {isOwnProfile && (
            <div className="flex justify-end space-x-2 pt-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2" size={16} />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};