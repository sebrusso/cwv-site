import Link from 'next/link';
import { config } from '@/lib/config-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ModeCardLinks() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Human vs Machine</CardTitle>
            <Badge className="whitespace-nowrap">Recommended</Badge>
          </div>
          <CardDescription>
            Guess the author, train our models. Which passage was written by a
            human?
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/human-machine">Start</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Human vs Human</CardTitle>
          <CardDescription>
            Crowdsource literary taste. Pick the stronger human-written story.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/">Start</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model vs Model</CardTitle>
          <CardDescription>
            Stress-test AI storytellers. Decide which model tells the better
            tale.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/model-evaluation">Start</Link>
          </Button>
        </CardFooter>
      </Card>

      {config.enableLeaderboard && (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              See what the data says so far. Live rankings from thousands of
              judgments.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {config.enableDashboard && config.showDashboardLink && (
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Your impact stats. Track accuracy, streaks, and contribution
              badges.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
