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
  const [literatureInterest, setLiteratureInterest] = useState<string[]>([]);
  const [writingBackground, setWritingBackground] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageRangeOptions = [
    "18-21",
    "22-25", 
    "26-29",
    "30-33",
    "34-37",
    "38-41",
    "42-45",
    "46-49",
    "50-53",
    "54-57",
    "58-61",
    "62-65",
    "66+"
  ];

  const educationOptions = [
    "High School",
    "Some College",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD/Doctorate",
    "Professional Degree",
    "Other"
  ];

  const literatureInterestOptions = [
    "Fiction",
    "Non-fiction",
    "Poetry",
    "Drama/Plays",
    "Science Fiction",
    "Fantasy",
    "Mystery/Thriller",
    "Romance",
    "Historical Fiction",
    "Biography/Memoir",
    "Academic/Research",
    "Not interested in literature"
  ];

  const writingBackgroundOptions = [
    "Professional writer",
    "Academic writer",
    "Creative writing hobbyist",
    "Journalist",
    "Blogger",
    "Student writer",
    "Business/Technical writing",
    "Social media content creator",
    "No writing experience",
    "Other"
  ];

  const handleLiteratureInterestChange = (option: string) => {
    setLiteratureInterest(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleWritingBackgroundChange = (option: string) => {
    setWritingBackground(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await updateProfile({
        age_range: ageRange,
        education_level: educationLevel,
        first_language: firstLanguage,
        literature_interest: literatureInterest.join(", "),
        writing_background: writingBackground.join(", "),
        demographics_completed: true,
      });
      router.push("/");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await updateProfile({ demographics_completed: true });
      router.push("/");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <div className="text-sm font-medium">Age Range</div>
        <select
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select age range</option>
          {ageRangeOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-sm font-medium">Education Level</div>
        <select
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select education level</option>
          {educationOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-sm font-medium">First Language</div>
        <Input
          value={firstLanguage}
          onChange={(e) => setFirstLanguage(e.target.value)}
        />
      </div>

      <div>
        <div className="text-sm font-medium">Literature Interest (select all that apply)</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {literatureInterestOptions.map(option => (
            <label key={option} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={literatureInterest.includes(option)}
                onChange={() => handleLiteratureInterestChange(option)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium">Writing Background (select all that apply)</div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {writingBackgroundOptions.map(option => (
            <label key={option} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={writingBackground.includes(option)}
                onChange={() => handleWritingBackgroundChange(option)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleSkip} disabled={loading}>
          {loading ? "Saving..." : "Skip for now"}
        </Button>
      </div>
    </form>
  );
}
