import React from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowRight,
  Users,
  RefreshCw,
  Star,
  Code,
  Palette,
  Music,
  BookOpen,
  Briefcase,
  Dumbbell,
  Zap,
  Heart,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HomeProps {
  isLoggedIn: boolean;
  stats?: {
    totalUsers: number;
    totalSwaps: number;
    totalSkills: number;
  };
}

export const Home: React.FC<HomeProps> = ({ isLoggedIn, stats }) => {
  const howItWorks = [
    {
      step: 1,
      title: "Create Your Profile",
      description:
        "Sign up and add skills you can teach and skills you want to learn",
      icon: Users,
    },
    {
      step: 2,
      title: "Find Your Match",
      description:
        "Browse users with complementary skills that match your interests",
      icon: RefreshCw,
    },
    {
      step: 3,
      title: "Request a Swap",
      description: "Send a swap request with your proposal and schedule",
      icon: Zap,
    },
    {
      step: 4,
      title: "Learn & Grow",
      description: "Exchange knowledge, leave feedback, and keep growing!",
      icon: Star,
    },
  ];

  const categories = [
    {
      name: "Programming & Tech",
      icon: Code,
      color: "bg-blue-100 text-blue-600",
    },
    {
      name: "Design & Creative",
      icon: Palette,
      color: "bg-pink-100 text-pink-600",
    },
    {
      name: "Music & Arts",
      icon: Music,
      color: "bg-purple-100 text-purple-600",
    },
    { name: "Languages", icon: BookOpen, color: "bg-green-100 text-green-600" },
    {
      name: "Business & Marketing",
      icon: Briefcase,
      color: "bg-orange-100 text-orange-600",
    },
    {
      name: "Fitness & Wellness",
      icon: Dumbbell,
      color: "bg-red-100 text-red-600",
    },
  ];

  const benefits = [
    {
      title: "100% Free",
      description:
        "No money exchanged—just pure skill sharing between community members",
      icon: Heart,
    },
    {
      title: "Community Driven",
      description:
        "Real people teaching real skills, building meaningful connections",
      icon: Users,
    },
    {
      title: "Learn Flexibly",
      description: "Set your own schedule and learn at your own pace",
      icon: RefreshCw,
    },
    {
      title: "Verified Reviews",
      description: "Our feedback system ensures quality exchanges every time",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <Zap size={16} className="mr-2 text-yellow-400" />
              The Future of Learning is Here
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Trade Skills,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Not Money
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              SkillSwap connects people who want to learn with people who want
              to teach. Exchange your expertise for new knowledge—no payments
              required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <NavLink to="/browse">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                  >
                    Browse Skills
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </NavLink>
              ) : (
                <>
                  <NavLink to="/auth/register">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </NavLink>
                  <NavLink to="/auth/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                    >
                      Sign In
                    </Button>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 sm:mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white">
                {stats?.totalUsers || "500"}+
              </div>
              <div className="text-gray-400 text-sm sm:text-base mt-1">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white">
                {stats?.totalSwaps || "1,200"}+
              </div>
              <div className="text-gray-400 text-sm sm:text-base mt-1">
                Skill Swaps
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white">
                {stats?.totalSkills || "100"}+
              </div>
              <div className="text-gray-400 text-sm sm:text-base mt-1">
                Skills Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Start swapping skills in just four simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore skills across diverse categories
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.name}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {category.name}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SkillSwap?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Join thousands of learners and teachers in our growing community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={benefit.title}
                  className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                      <Icon size={24} className="text-gray-900" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section className="py-20 sm:py-28 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-8">
            <Star size={32} className="text-yellow-400" />
          </div>
          <blockquote className="text-2xl sm:text-3xl font-medium leading-relaxed mb-8">
            "The best investment you can make is in yourself. SkillSwap makes
            that investment accessible to everyone."
          </blockquote>
          <div className="flex items-center justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className="text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <p className="text-gray-400 mt-4">
            Join our community of learners today
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-gray-100 to-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Swapping?
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            Join SkillSwap today and unlock a world of learning opportunities.
            It's completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <NavLink to="/browse">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg font-semibold"
                >
                  Start Browsing
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </NavLink>
            ) : (
              <>
                <NavLink to="/auth/register">
                  <Button
                    size="lg"
                    className="bg-black text-white hover:bg-gray-800 px-8 py-6 text-lg font-semibold"
                  >
                    Create Free Account
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </NavLink>
                <NavLink to="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 px-8 py-6 text-lg"
                  >
                    Sign In
                  </Button>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
            </p>
            <p className="mt-2">
              Made with <Heart size={14} className="inline text-red-500" /> for
              the learning community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
