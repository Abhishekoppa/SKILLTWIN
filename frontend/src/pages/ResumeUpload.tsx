import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, History, Clock } from "lucide-react";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const navigate = useNavigate();

  const { data: historyResumes, isLoading: isLoadingHistory, refetch } = useQuery({
    queryKey: ["resumeHistory"],
    queryFn: async () => {
      const res = await apiClient.get("/resumes/");
      return res.data;
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      setFile(null);
    } else {
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (targetRole) {
      formData.append("target_role", targetRole);
    }
    if (githubUrl) {
      formData.append("github_url", githubUrl);
    }

    try {
      await apiClient.post("/resumes/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      refetch();
      navigate("/profile"); 
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 py-12 px-4">
      <div className="text-center mb-10 mt-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-3 text-slate-900">Let's Build Your Profile</h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Upload your resume to automatically extract your skills, experience, and tailor your dynamic interview.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl border-slate-200">
          <CardHeader className="text-center pb-2 bg-slate-50/50 border-b">
            <CardTitle className="text-2xl">Upload New Resume</CardTitle>
            <CardDescription>We only accept PDF format</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-3 text-left">
              <label className="text-sm font-semibold text-slate-700">Target Job Title (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Frontend Developer" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="flex h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-sm text-slate-500">We'll calculate an ATS match score based on this role.</p>
            </div>
            <div className="space-y-3 text-left">
              <label className="text-sm font-semibold text-slate-700">GitHub Profile URL (Optional)</label>
              <input 
                type="text" 
                placeholder="https://github.com/username" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-sm text-slate-500">We'll scan your repos to adapt your interview questions.</p>
            </div>
            <div 
              className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'} ${file && !error ? 'border-green-400 bg-green-50/50' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                id="resume" 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center space-y-4 px-4">
                {file && !error ? (
                  <>
                    <div className="p-5 bg-green-100 rounded-full shadow-sm">
                      <FileText className="w-12 h-12 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{file.name}</p>
                      <p className="text-base text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload</p>
                    </div>
                    <div className="flex items-center text-sm font-medium text-green-700 bg-green-100/50 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Valid PDF file
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`p-5 rounded-full shadow-sm transition-colors ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-white text-slate-500 border'}`}>
                      <UploadCloud className={`w-12 h-12 ${isDragActive ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">
                        <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-base text-slate-500 mt-2">PDF files up to 5MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-slate-50/80 rounded-b-xl border-t p-6">
            <Button 
              variant="outline" 
              onClick={() => { setFile(null); setError(null); }}
              disabled={!file || isUploading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading} 
              size="lg"
              className="w-48 text-base font-bold shadow-md"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : "Upload & Analyze"}
            </Button>
          </CardFooter>
        </Card>

        {/* Upload History Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg border-slate-200 h-full flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <History className="w-5 h-5 mr-2 text-slate-500" />
                Upload History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {isLoadingHistory ? (
                <div className="p-8 flex justify-center items-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                </div>
              ) : historyResumes?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-3 text-slate-300" />
                  <p>No resumes uploaded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {historyResumes?.map((res: any) => (
                    <div key={res.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2 group cursor-pointer" onClick={() => navigate('/profile')}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-sm text-slate-900 truncate" title={res.filename}>{res.filename}</p>
                            <p className="text-xs text-slate-500 flex items-center mt-0.5">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(res.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {res.parsed_data?.ats_score !== undefined && (
                        <div className="flex items-center justify-between pl-11">
                          <span className="text-xs font-medium text-slate-500">ATS Match</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${res.parsed_data.ats_score >= 80 ? 'bg-green-100 text-green-700' : res.parsed_data.ats_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {res.parsed_data.ats_score}/100
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
