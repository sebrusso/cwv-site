"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authors } from "@/lib/authors";

export default function MvpPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDatasetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/request-dataset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request dataset");
      }

      setDownloadUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 px-4 py-8">
      {/* Header Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          LitBench
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          LitBench is a benchmark and dataset aimed at improving automated creative writing evaluation, 
          featuring thousands of pairwise, human-labeled story comparisons. We apply preference distillation 
          techniques to fine-tune LLMs, and the resultant Bradley–Terry and generative reward models trained 
          on LitBench markedly surpass existing zero-shot language model evaluators.
        </p>
      </section>

      {/* Key Findings */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Key Findings</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">43k+</div>
            <p className="text-sm text-muted-foreground">Human-labeled pairwise story comparisons in training set</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">2.5k</div>
            <p className="text-sm text-muted-foreground">Held-out benchmark comparisons for evaluation</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">Superior</div>
            <p className="text-sm text-muted-foreground">Performance vs existing zero-shot evaluators</p>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/paper.pdf">
            <Button size="lg" className="w-full sm:w-auto">
              📄 Read the Paper
            </Button>
          </Link>
        </div>

        {/* Dataset Download */}
        <div className="bg-muted/50 rounded-lg p-6 max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-4 text-center">Download Dataset</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Access our comprehensive dataset of human-labeled story comparisons. 
            Enter your email to receive the download link.
          </p>
          
          {!downloadUrl ? (
            <form onSubmit={handleDatasetRequest} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Processing..." : "Get Dataset"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-green-600 font-medium">
                ✅ Email registered successfully!
              </p>
              <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  📥 Download Dataset
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Dataset includes training and evaluation sets with comprehensive metadata.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="text-center space-y-6 bg-muted/30 rounded-lg p-8">
        <h2 className="text-2xl font-semibold">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          We're actively developing additional features that will be released in the coming weeks and months:
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Human vs Machine Detection</h3>
            <p className="text-sm text-muted-foreground">
              Interactive arena for distinguishing between human and AI-written stories
            </p>
          </div>
          
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Human vs Human Arena</h3>
            <p className="text-sm text-muted-foreground">
              Compare stories written by different human authors
            </p>
          </div>
          
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Model vs Model Battles</h3>
            <p className="text-sm text-muted-foreground">
              Head-to-head comparisons between different AI models
            </p>
          </div>
          
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Model Evaluation Suite</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive testing of AI creative writing capabilities
            </p>
          </div>
          
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Real-time Leaderboards</h3>
            <p className="text-sm text-muted-foreground">
              Live rankings and performance metrics
            </p>
          </div>
          
          <div className="bg-background rounded-md p-4 space-y-2">
            <h3 className="font-medium">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Detailed insights into creative writing patterns
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground space-y-2 pt-8 border-t">
        <p>Authors: {authors.join(', ')}</p>
        <p>Autonomous Agents Lab at Stanford (Nick Haber, PI)</p>
        <p className="text-xs">
          LitBench paper submitted at NeurIPS 2025 • Dataset & code MIT-licensed
        </p>
      </footer>
    </div>
  );
}
