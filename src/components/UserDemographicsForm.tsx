"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";

export function UserDemographicsForm() {
  const { updateProfile } = useUser();
  const router = useRouter();

  const [ageRange, setAgeRange] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [firstLanguage, setFirstLanguage] = useState("");
  const [literatureInterest, setLiteratureInterest] = useState("");
  const [readingHabits, setReadingHabits] = useState("");
  const [writingBackground, setWritingBackground] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile({
      age_range: ageRange,
      education_level: educationLevel,
      first_language: firstLanguage,
      literature_interest: literatureInterest,
      reading_habits: readingHabits,
      writing_background: writingBackground,
      demographics_completed: true,
    });
    router.push("/");
  };

  const handleSkip = async () => {
    setLoading(true);
    await updateProfile({ demographics_completed: true });
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-sm font-medium">Age Range</div>
        <Input
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium">Education Level</div>
        <Input
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium">First Language</div>
        <Input
          value={firstLanguage}
          onChange={(e) => setFirstLanguage(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium">Literature Interest</div>
        <Input
          value={literatureInterest}
          onChange={(e) => setLiteratureInterest(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium">Reading Habits</div>
        <Input
          value={readingHabits}
          onChange={(e) => setReadingHabits(e.target.value)}
        />
      </div>
      <div>
        <div className="text-sm font-medium">Writing Background</div>
        <Input
          value={writingBackground}
          onChange={(e) => setWritingBackground(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>Save</Button>
        <Button type="button" variant="secondary" onClick={handleSkip} disabled={loading}>
          Skip for now
        </Button>
      </div>
    </form>
  );
}
