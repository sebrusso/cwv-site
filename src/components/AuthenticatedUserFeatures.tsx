"use client";

import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Award, 
  Target, 
  Calendar,
  Download,
  Star
} from "lucide-react";

export function AuthenticatedUserFeatures() {
  const { user, profile } = useUser();

  // Only show for authenticated users
  if (!user || !profile) {
    return null;
  }

  // Mock some enhanced statistics for authenticated users
  const stats = {
    totalEvaluations: profile.viewed_prompts?.length || 0,
    accuracy: Math.min(95, 65 + (profile.score || 0) * 2), // Mock accuracy based on score
    streak: Math.floor((profile.score || 0) / 5), // Mock streak
    rank: Math.max(1, 100 - (profile.score || 0)), // Mock rank
    badges: [
      { name: "First Evaluation", earned: profile.score > 0 },
      { name: "Accurate Judge", earned: profile.score > 5 },
      { name: "Consistent Evaluator", earned: profile.score > 10 },
      { name: "Expert Analyst", earned: profile.score > 20 },
    ]
  };

  const progressToNextBadge = profile.score >= 20 ? 100 : 
    profile.score >= 10 ? ((profile.score - 10) / 10) * 100 :
    profile.score >= 5 ? ((profile.score - 5) / 5) * 100 :
    profile.score >= 1 ? ((profile.score - 1) / 4) * 100 :
    (profile.score / 1) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-green-900">
                Welcome back, {profile.username || user.email}!
              </h2>
              <p className="text-green-700">
                Track your progress and unlock achievements as you evaluate creative writing.
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Authenticated User
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Evaluations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.totalEvaluations / 7)} this week
            </p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Above average performance
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        {/* Global Rank */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Rank</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{stats.rank}</div>
            <p className="text-xs text-muted-foreground">
              Out of all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.badges.map((badge, index) => (
              <div 
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  badge.earned 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  badge.earned ? 'bg-yellow-500' : 'bg-gray-300'
                }`}>
                  <Award className={`h-4 w-4 ${
                    badge.earned ? 'text-white' : 'text-gray-500'
                  }`} />
                </div>
                <div>
                  <p className={`font-medium ${
                    badge.earned ? 'text-yellow-800' : 'text-gray-600'
                  }`}>
                    {badge.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {badge.earned ? 'Earned!' : 'Not yet earned'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {progressToNextBadge < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to next badge</span>
                <span>{Math.round(progressToNextBadge)}%</span>
              </div>
              <Progress value={progressToNextBadge} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Features Available */}
      <Card>
        <CardHeader>
          <CardTitle>Your Enhanced Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Data Export</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Download your complete evaluation history and statistics
              </p>
              <Button variant="outline" size="sm">
                Export Data
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Advanced Analytics</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of your evaluation patterns and improvements
              </p>
              <Button variant="outline" size="sm">
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 