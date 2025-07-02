"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

      setDownloadUrl("github");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 px-4 py-8">
      {/* Header Section */}
      <section className="text-center space-y-8">
        {/* Title and Authors */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            LitBench: A Benchmark and Dataset for Reliable<br />
            Evaluation of Creative Writing
          </h1>
          
          {/* Authors */}
          <div className="space-y-3">
            <div className="text-base text-foreground/80 space-y-1">
              <div>Daniel Fein<sup>1</sup>&nbsp;&nbsp;Sebastian Russo<sup>1</sup>&nbsp;&nbsp;Violet Xiang<sup>1</sup></div>
              <div>Kabir Jolly<sup>1</sup>&nbsp;&nbsp;Rafael Rafailov<sup>1</sup>&nbsp;&nbsp;Nick Haber<sup>1</sup></div>
            </div>
            <div className="text-sm text-foreground/70">
              <sup>1</sup>Stanford University
            </div>
          </div>
        </div>
        
        {/* Bottom line */}
        <div className="w-full border-t border-foreground/20"></div>
        
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
          LitBench is a benchmark and dataset aimed at improving automated creative writing evaluation, 
          featuring thousands of pairwise, human-labeled story comparisons. We apply preference distillation 
          techniques to fine-tune LLMs, and the resultant Bradley–Terry and generative reward models trained 
          on LitBench markedly surpass existing zero-shot language model evaluators.
        </p>
      </section>

      {/* Key Contributions */}
      <section className="text-center space-y-6">
        <h2 className="text-2xl font-semibold">Key Contributions</h2>
        
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-primary">43k+</div>
            <p className="text-sm text-muted-foreground">
              Human-labeled pairwise story comparisons in training set
            </p>
          </div>
          
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-primary">2.5k</div>
            <p className="text-sm text-muted-foreground">
              Held-out benchmark comparisons for evaluation
            </p>
          </div>
          
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <div className="text-3xl font-bold text-primary">Superior</div>
            <p className="text-sm text-muted-foreground">
              Performance vs existing zero-shot evaluators
            </p>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
          {/* Paper View Button */}
          <div className="w-full md:w-1/3">
            <Link href="https://arxiv.org/abs/2507.00769" target="_blank" rel="noopener noreferrer" className="block h-full">
              <div className="h-full w-full flex flex-col items-center justify-start gap-6 py-6 px-4 border border-gray-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="pt-4">
                  <span className="text-xl font-bold hover:text-primary transition-colors">View Paper</span>
                </div>
                <div className="relative w-full h-28 flex items-center justify-center mt-2">
                  <Image 
                    src="/arxiv.png" 
                    alt="arXiv" 
                    fill
                    sizes="(max-width: 768px) 100vw, 200px"
                    style={{objectFit: "contain"}}
                    priority
                    quality={100}
                  />
                </div>
              </div>
            </Link>
          </div>
          
          {/* Dataset Download */}
          <div className="bg-white rounded-lg p-6 w-full md:w-2/3 border border-gray-200 shadow-sm flex flex-col justify-start">
            <div className="pt-4">
              <h3 className="text-xl font-semibold text-center">Access Dataset</h3>
              <p className="text-sm text-muted-foreground mt-3 mb-6 text-center">
                Enter your email address to access the dataset and resources.
              </p>
            </div>
            
            {!downloadUrl ? (
              <form onSubmit={handleDatasetRequest} className="space-y-6 mt-2">
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
                  {isSubmitting ? "Processing..." : "Access Dataset"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 mt-2">
                <p className="text-sm text-green-600 font-medium text-center">
                  ✅ Email registered successfully!
                </p>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Access training data and rehydration code from <strong>GitHub</strong>, and get comment IDs from our <strong>HuggingFace</strong> collection.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href="https://github.com/drfein/LitBench" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        Code (Github)
                      </Button>
                    </Link>
                    
                    <Link href="https://huggingface.co/collections/SAA-Lab/litbench-68267b5da3aafe58f9e43461" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        Dataset (Huggingface)
                      </Button>
                    </Link>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    <strong>Note:</strong> Rehydration takes 1-2 hours due to Reddit API rate limits.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="text-center space-y-6">
        <h2 className="text-2xl font-semibold">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          We're actively developing additional features that will be released in the coming weeks and months:
        </p>
        
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <h3 className="font-medium">Human vs Machine Detection</h3>
            <p className="text-sm text-muted-foreground">
              Interactive arena for distinguishing between human and AI-written stories
            </p>
          </div>
          
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <h3 className="font-medium">Model vs Model Battles</h3>
            <p className="text-sm text-muted-foreground">
              Head-to-head comparisons between different AI models
            </p>
          </div>
          
          <div className="bg-white rounded-md p-4 space-y-2 border border-gray-200 shadow-sm">
            <h3 className="font-medium">Real-time Leaderboards</h3>
            <p className="text-sm text-muted-foreground">
              Live rankings and performance metrics
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-muted-foreground space-y-2 pt-8 border-t">
        <p>Authors: {authors.join(', ')}</p>
        <p>
          <Link href="https://www.autonomousagents.stanford.edu/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Autonomous Agents Lab
          </Link> at Stanford (Nick Haber, PI)
        </p>
        <p className="text-xs">
          LitBench paper submitted at NeurIPS 2025 • Dataset & code MIT-licensed
        </p>
      </footer>
    </div>
  );
}
