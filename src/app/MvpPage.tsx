import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authors } from "@/lib/authors";

export default function MvpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Creative Writing Evaluation Arena</h1>
        <p className="text-muted-foreground space-y-2">
          <span className="block">LitBench is a benchmark and dataset aimed at improving automated creative writing evaluation, featuring thousands of pairwise, human-labeled story comparisons.</span>
          <span className="block">We apply preference distillation techniques to fine-tune LLMs, and the resultant Bradley–Terry and generative reward models trained on LitBench markedly surpass existing zero-shot language model evaluators.</span>
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/paper.pdf">
            <Button size="sm" variant="secondary">Read the Paper</Button>
          </Link>
          <Link href="/dataset">
            <Button size="sm" variant="secondary">Download Dataset</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Key Findings</h2>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>Human preference data enables reliable evaluation of creative writing.</li>
          <li>Reward models trained with preference distillation outperform zero-shot LLM judges.</li>
          <li>Open dataset and models foster reproducible research.</li>
        </ul>
      </section>

      <section>
        <p className="text-sm text-muted-foreground">
          Advanced features like human versus machine comparisons and model evaluation will roll out in the coming weeks.
        </p>
      </section>

      <footer className="text-center text-sm text-muted-foreground space-y-1">
        <p>Authors: {authors.join(', ')}</p>
        <p>Autonomous Agents Lab at Stanford (Nick Haber, PI)</p>
      </footer>
    </div>
  );
}
