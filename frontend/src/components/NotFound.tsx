import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
// shadcn/ui imports
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8 sm:p-12">
            {/* Icon */}
            <div className="mb-8">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-32 h-32 bg-black rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertTriangle size={64} className="text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-gray-600" size={24} />
                <Sparkles className="absolute -bottom-2 -left-2 text-gray-600" size={20} />
              </div>
            </div>

            {/* Error Code */}
            <div className="mb-6">
              <h1 className="text-8xl sm:text-9xl font-bold text-black mb-2">
                404
              </h1>
              <div className="w-24 h-1 bg-black rounded-full mx-auto"></div>
            </div>

            {/* Message */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Oops! Page Not Found
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                The page you're looking for seems to have wandered off into the digital wilderness. 
                Don't worry, we'll help you find your way back to amazing skills!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button asChild className="w-full sm:w-auto px-8 py-4">
                <NavLink to="/">
                  <Home size={20} className="mr-3" />
                  <span>Back to Home</span>
                </NavLink>
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button asChild variant="outline">
                  <NavLink to="/">
                    <Search size={18} className="mr-2" />
                    <span>Browse Skills</span>
                  </NavLink>
                </Button>

                <Button variant="outline" onClick={() => window.history.back()}>
                  <ArrowLeft size={18} className="mr-2" />
                  <span>Go Back</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                <strong>Lost?</strong> Try using the navigation menu above or search for specific skills you're interested in.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fun Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-bold text-gray-900">∞</div>
              <div className="text-xs text-gray-600">Skills to Learn</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-bold text-gray-900">24/7</div>
              <div className="text-xs text-gray-600">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-bold text-gray-900">100%</div>
              <div className="text-xs text-gray-600">Free</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};