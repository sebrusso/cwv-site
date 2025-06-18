"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { shouldEncourageSignup } from "@/lib/auth-utils-client";
import { LoginForm } from "./LoginForm";
import { 
  User, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Download, 
  Settings,
  X 
} from "lucide-react";

interface SignupEncouragementProps {
  trigger?: 'banner' | 'modal' | 'inline';
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function SignupEncouragement({ 
  trigger = 'banner', 
  onDismiss,
  showDismiss = true 
}: SignupEncouragementProps) {
  const { user } = useUser();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  // Don't show if user is authenticated, component is dismissed, or we are on the server.
  if (!isClient || !shouldEncourageSignup(user) || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const benefits = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Personal Progress Tracking",
      description: "Track your evaluation accuracy and improvement over time"
    },
    {
      icon: <Award className="h-4 w-4" />,
      title: "Achievement Badges",
      description: "Unlock badges for milestones and consistent participation"
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: "Advanced Analytics",
      description: "Get detailed insights into your evaluation patterns"
    },
    {
      icon: <Download className="h-4 w-4" />,
      title: "Export Your Data",
      description: "Download your evaluation history and statistics"
    },
    {
      icon: <Settings className="h-4 w-4" />,
      title: "Custom Preferences",
      description: "Personalize your experience and set evaluation preferences"
    }
  ];

  if (showLoginForm) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Create Your Account</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowLoginForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm onClose={() => setShowLoginForm(false)} />
        </CardContent>
      </Card>
    );
  }

  if (trigger === 'banner') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                Unlock Enhanced Features
              </h3>
              <p className="text-sm text-blue-700">
                Create a free account to track progress, earn badges, and access advanced analytics.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setShowLoginForm(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign Up Free
            </Button>
            {showDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (trigger === 'modal') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Enhance Your Experience</CardTitle>
            {showDismiss && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            You&apos;re doing great! Create a free account to unlock these additional features:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <div className="bg-white p-1 rounded">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Free Forever</Badge>
              <Badge variant="secondary">No Spam</Badge>
              <Badge variant="secondary">2-Minute Setup</Badge>
            </div>
            <Button onClick={() => setShowLoginForm(true)}>
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline trigger
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="font-medium">Want to track your progress?</h4>
            <p className="text-sm text-muted-foreground">
              Create a free account to unlock personal statistics and more.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLoginForm(true)}
          >
            Sign Up
          </Button>
          {showDismiss && (
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 