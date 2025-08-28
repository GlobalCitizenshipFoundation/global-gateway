import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Award, Briefcase, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto p-4 flex justify-between items-center border-b border-border">
        <Link href="/" className="text-2xl font-bold text-primary">
          Global Gateway
        </Link>
        <nav>
          <Button asChild variant="default">
            <Link href="/login">Login / Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 text-center bg-gradient-to-br from-primary to-primary-container text-primary-foreground flex items-center justify-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Empowering Global Citizens Through Opportunity
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 opacity-90">
              Your gateway to global programs, fellowships, hiring, and awards management.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild variant="secondary" className="px-6 py-3 text-lg">
                <Link href="/login">Explore Programs</Link>
              </Button>
              <Button asChild variant="outline" className="px-6 py-3 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Campaigns Section (Placeholder) */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Featured Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Globe className="h-5 w-5" /> Global Fellowship</CardTitle>
                <CardDescription>A prestigious program for emerging leaders.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">Applications open soon for our annual Global Fellowship program. Join a network of changemakers.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Briefcase className="h-5 w-5" /> Impact Hiring Initiative</CardTitle>
                <CardDescription>Join our team and make a difference.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">We're looking for passionate individuals to contribute to our mission. Explore open roles.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary"><Award className="h-5 w-5" /> Annual Innovation Awards</CardTitle>
                <CardDescription>Recognizing groundbreaking contributions.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">Nominate individuals or projects pushing the boundaries of global citizenship.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">Global Gateway</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Your internal platform to engage in Global Certification and Accreditation at the Global Citizenship Foundation.
            The Portal is globalcertification.org, the Global Gateway is hosted on my.globalcertification.org.
          </p>
          <p className="text-xs text-muted-foreground mt-4">&copy; {new Date().getFullYear()} Global Citizenship Foundation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}