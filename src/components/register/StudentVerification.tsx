import { ArrowLeft, Upload, FileCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNIVERSITIES = [
  "University of Zambia",
  "Copperbelt University",
  "Mukuba University",
  "Makerere University",
  "University of Nairobi",
  "University of Cape Town",
  "Ashesi University",
  "University of Dar es Salaam",
  "University of Lagos",
  "Kenyatta University",
  "Other",
];

interface Props {
  universityName: string;
  setUniversityName: (name: string) => void;
  studentIdFile: File | null;
  setStudentIdFile: (file: File | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StudentVerification({ universityName, setUniversityName, studentIdFile, setStudentIdFile, onContinue, onBack }: Props) {
  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-foreground">University verification</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Upload your student ID to get a verified badge on your profile. This boosts investor confidence in your projects.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <Label>University</Label>
          <Select value={universityName} onValueChange={setUniversityName}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent>
              {UNIVERSITIES.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Student ID Card</Label>
          <div className="mt-1.5">
            {studentIdFile ? (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                <FileCheck className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{studentIdFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(studentIdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStudentIdFile(null)} className="text-xs">Remove</Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload your student ID</span>
                <span className="text-xs text-muted-foreground">JPG, PNG or PDF up to 5MB</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setStudentIdFile(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground mb-6">
        Your student ID will be reviewed by our admin team. Once approved, you'll receive a verified university badge visible on your profile and startup listings.
      </div>

      <Button className="w-full" disabled={!universityName || !studentIdFile} onClick={onContinue}>Continue</Button>
    </>
  );
}
