import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, MessageSquare, TrendingUp, Rocket, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, profile, roles, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const primaryRole = roles[0] || "founder";

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">{primaryRole}</Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { icon: Eye, label: "Profile Views", value: "0", change: "—" },
            { icon: Users, label: "Connections", value: "0", change: "—" },
            { icon: MessageSquare, label: "Messages", value: "0", change: "—" },
            { icon: TrendingUp, label: "Engagement", value: "0%", change: "—" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {primaryRole === "founder" && (
                <>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <Rocket className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Create your startup</h3>
                    <p className="text-xs text-muted-foreground">Add your startup profile to get discovered</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Upload pitch deck</h3>
                    <p className="text-xs text-muted-foreground">Get AI-powered feedback on your pitch</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <Users className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Find investors</h3>
                    <p className="text-xs text-muted-foreground">Get matched with relevant investors</p>
                  </div>
                </>
              )}
              {primaryRole === "investor" && (
                <>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <Eye className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Browse startups</h3>
                    <p className="text-xs text-muted-foreground">Discover promising ventures</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Set preferences</h3>
                    <p className="text-xs text-muted-foreground">Configure your investment focus</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <MessageSquare className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Complete profile</h3>
                    <p className="text-xs text-muted-foreground">Help founders find you</p>
                  </div>
                </>
              )}
              {(primaryRole === "mentor" || primaryRole === "university" || primaryRole === "admin") && (
                <>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <Users className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Complete your profile</h3>
                    <p className="text-xs text-muted-foreground">Share your expertise and background</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <Eye className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-medium text-foreground mb-1">Explore the platform</h3>
                    <p className="text-xs text-muted-foreground">Discover startups and founders</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
