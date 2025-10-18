import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { DataCategoryCard } from "@/components/DataCategoryCard";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Brain, 
  Heart, 
  BookOpen, 
  TrendingUp, 
  Zap,
  Target,
  Moon,
  Receipt
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="sacred-geometry absolute inset-0 opacity-20" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 font-orbitron text-glow">
              ASAPP
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-inter">
              Your Quantitative Self
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-inter">
              Gather, analyze, and understand every aspect of your existence. 
              Transform data into wisdom, numbers into enlightenment.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary-glow text-background font-medium border-glow">
                <Zap className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 font-orbitron text-center">Today's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Daily Activity"
              value="12,847"
              change="+14%"
              icon={Activity}
              trend="up"
            />
            <MetricCard
              title="Focus Score"
              value="87%"
              change="+5%"
              icon={Brain}
              trend="up"
            />
            <MetricCard
              title="Wellness Index"
              value="92"
              change="+2"
              icon={Heart}
              trend="up"
            />
            <MetricCard
              title="Sleep Quality"
              value="8.4h"
              change="-0.3h"
              icon={Moon}
              trend="down"
            />
          </div>
        </div>
      </section>

      {/* Data Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 font-orbitron text-center">Data Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DataCategoryCard
              title="Physical Health"
              description="Track movement, vitals, and physical wellness metrics"
              icon={Heart}
              dataPoints={45231}
            />
            <DataCategoryCard
              title="Mental Clarity"
              description="Monitor focus, mood, and cognitive performance"
              icon={Brain}
              dataPoints={12847}
            />
            <DataCategoryCard
              title="Learning & Growth"
              description="Measure knowledge acquisition and skill development"
              icon={BookOpen}
              dataPoints={8924}
            />
            <DataCategoryCard
              title="Productivity"
              description="Analyze work patterns and efficiency metrics"
              icon={TrendingUp}
              dataPoints={34567}
            />
            <DataCategoryCard
              title="Energy Levels"
              description="Track vitality and daily energy patterns"
              icon={Zap}
              dataPoints={23456}
            />
            <DataCategoryCard
              title="Goals & Achievements"
              description="Monitor progress towards personal objectives"
              icon={Target}
              dataPoints={1847}
            />
          </div>
        </div>
      </section>

      {/* Finance Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-8 h-8 text-background" />
            </div>
            <h2 className="text-4xl font-bold font-orbitron mb-4">Finance Tracker</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Upload and analyze your bank statements with AI-powered transaction extraction. 
              Categorize spending, track trends, and gain insights into your financial patterns.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary-glow text-background font-medium border-glow"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground font-inter">
            ASAPP - Know Thyself Through Data
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-inter">
            "The unexamined life is not worth living" - Socrates
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
