import { useQuery, useMutation } from "@tanstack/react-query";
import { profileApi } from "../api/profile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["skillTwin"],
    queryFn: profileApi.getSkillTwin,
  });

  const analyzeMutation = useMutation({
    mutationFn: profileApi.analyzeProfile,
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Profile Data...</div>;
  }

  const username = user?.email?.split('@')[0] || "Candidate";

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            <span className="text-primary">{username}'s</span> SkillTwin
          </h1>
          <p className="text-lg text-slate-600 mt-2">Your mathematically proven, evidence-based capabilities model.</p>
          {profile?.target_role && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              🎯 Target Role: {profile.target_role}
            </div>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {profile?.ats_score !== undefined && profile?.ats_score !== null && (
            <div className={`flex flex-col items-center justify-center p-3 rounded-lg border ${profile.ats_score >= 80 ? 'bg-green-50 border-green-200' : profile.ats_score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ATS Match Score</div>
              <div className={`text-3xl font-black ${profile.ats_score >= 80 ? 'text-green-600' : profile.ats_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {profile.ats_score}<span className="text-sm text-slate-400 font-medium">/100</span>
              </div>
            </div>
          )}
          <Button 
            onClick={() => analyzeMutation.mutate()} 
            disabled={analyzeMutation.isPending}
            size="lg"
          >
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Sources"}
          </Button>
        </div>
      </div>

      {profile?.ats_feedback && (
        <Card className="mb-8 border-slate-200 shadow-sm bg-blue-50/50">
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center text-blue-800">
              <span className="text-2xl mr-2">💡</span> ATS Optimization Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900/80 leading-relaxed">{profile.ats_feedback}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profile?.candidate_skills.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500">
            No skills detected yet. Upload your resume or connect GitHub to build your profile.
          </div>
        ) : (
          profile?.candidate_skills.map((cs) => (
            <Card key={cs.id}>
              <CardHeader>
                <CardTitle>{cs.skill.name}</CardTitle>
                <CardDescription>{cs.skill.category || "Skill"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                    <span className="text-slate-600 font-medium">Claimed (Resume)</span>
                    <span className="font-bold text-slate-900">{cs.claimed_confidence ? `${cs.claimed_confidence}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                    <span className="text-slate-600 font-medium">Evidence (GitHub)</span>
                    <span className="font-bold text-slate-900">{cs.evidence_confidence ? `${cs.evidence_confidence}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-primary/5 p-2 rounded-md border border-primary/10">
                    <span className="text-primary font-bold">Demonstrated (Interview)</span>
                    <span className="font-black text-primary text-lg">{cs.demonstrated_score ? `${cs.demonstrated_score}%` : 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
