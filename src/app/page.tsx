import Link from "next/link";
import { Button } from "@/components/ui/button";
import ModeCardLinks from "@/components/ModeCardLinks";
import { authors } from "@/lib/authors";
import { SignupEncouragement } from "@/components/SignupEncouragement";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Creative Writing Evaluation Arena
        </h1>
        <p className="text-muted-foreground space-y-2">
          <span className="block font-medium">Help us benchmark creativity.</span>
          <span>
            LitBench is the first open benchmark and dataset for reliable evaluation of
            human- and AI-written stories. By casting your vote in the Arena, you supply
            hard-to-get preference data that powers the LitBench paper and our open-source
            reward models.
          </span>
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/paper.pdf">
            <Button size="sm" variant="secondary">Read the Paper</Button>
          </Link>
          <Link href="/resources">
            <Button size="sm" variant="secondary">Dataset &amp; Models</Button>
          </Link>
        </div>
      </section>

      <SignupEncouragement trigger="banner" />

      <div className="flex justify-center gap-4">
        <Link href="/resources">
          <Button size="lg">Resources</Button>
        </Link>
      </div>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          How your votes help &ndash; Every comparison you make is logged into
          LitBench&apos;s 43 k-pair training set and 2.5 k-pair held-out benchmark,
          letting us measure and improve automated judges of creative writing.
        </p>
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
        <p className="text-xs text-muted-foreground text-center mt-4">
          LitBench paper submitted at NeurIPS 2025, Dataset &amp; code MIT-licensed.
        </p>
      </section>

      <footer className="text-center text-sm text-muted-foreground space-y-1">
        <p>Authors: {authors.join(', ')}</p>
        <p>Autonomous Agents Lab at Stanford (Nick Haber, PI)</p>
      </footer>
    </div>
  );
}
