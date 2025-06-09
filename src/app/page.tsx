import Link from "next/link";
import { Button } from "@/components/ui/button";
import ModeCardLinks from "@/components/ModeCardLinks";
import { authors } from "@/lib/authors";
import { SignupCTA } from "@/components/SignupCTA";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Creative Writing Evaluation Arena
        </h1>
        <p className="text-muted-foreground">
          Explore how humans judge creative writing and help us study human vs AI storytelling.
        </p>
      </section>

      <SignupCTA />

      <div className="flex justify-center gap-4">
        <Link href="/resources">
          <Button size="lg">Resources</Button>
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-center">Main Features</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Choose an evaluation mode to get started.
        </p>
        <div className="mb-6">
          <ModeCardLinks />
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/human">
            <Button variant="secondary" size="lg">Human vs Human Arena</Button>
          </Link>
          <Link href="/human-machine">
            <Button variant="secondary" size="lg">Human vs Machine</Button>
          </Link>
          <Link href="/model-evaluation">
            <Button variant="secondary" size="lg">Model Evaluation</Button>
          </Link>
        </div>
      </section>

      <footer className="text-center text-sm text-muted-foreground space-y-1">
        <p>Authors: {authors.join(', ')}</p>
        <p>Autonomous Agents Lab at Stanford (Nick Haber, PI)</p>
      </footer>
    </div>
  );
}
