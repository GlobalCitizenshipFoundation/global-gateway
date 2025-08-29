import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Award, Briefcase, ArrowRight } from "lucide-react";
import React from "react";
import { KineticText } from "@/components/KineticText"; // Import the new KineticText component

export default function HomePage() {
  const animatedWords = ["Accreditation", "Support", "Opportunities", "Community", "Recognition", "Connections", "Distinction"];

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full py-20 flex flex-col md:flex-row items-center justify-center bg-background px-4 sm:px-8 lg:px-12 xl:px-24 gap-12">
          <div className="flex-1 text-center md:text-left space-y-8 max-w-2xl">
            <h1 className="text-display-medium sm:text-display-large font-bold text-foreground leading-tight flex flex-col">
              <span>Your Gateway to Global</span>
              <KineticText words={animatedWords} className="text-primary" />
            </h1>
            <p className="text-headline-small text-muted-foreground">
              Celebrating individuals and organizations foster positive change with global certification and accreditation.
            </p>
            <Button asChild variant="filled" size="lg" className="rounded-lg px-8 py-6 shadow-md hover:bg-primary/90">
              <Link href="/login">
                Explore Pathways <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center max-w-md md:max-w-lg relative h-64 md:h-96 rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-secondary-container to-background opacity-70 dark:opacity-50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded-full bg-gradient-radial from-primary/30 to-transparent blur-2xl opacity-60 animate-pulse-slow"></div>
            </div>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-radial from-secondary/30 to-transparent blur-2xl opacity-60 animate-pulse-slow delay-500"></div>
          </div>
        </section>

        {/* Featured Opportunities Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 bg-background">
          <h2 className="text-headline-large md:text-display-small text-center mb-12 text-foreground">Featured Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="flex flex-col h-full rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-headline-small text-primary"><Globe className="h-6 w-6" /> Global Fellowship</CardTitle>
                <CardDescription className="text-body-medium text-muted-foreground">A prestigious program for emerging leaders.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow text-body-medium text-card-foreground">
                <p>Applications open soon for our annual Global Fellowship program. Join a network of changemakers.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="tonal" className="w-full rounded-md">
                  <Link href="/login">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col h-full rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-headline-small text-primary"><Briefcase className="h-6 w-6" /> Impact Hiring Initiative</CardTitle>
                <CardDescription className="text-body-medium text-muted-foreground">Join our team and make a difference.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow text-body-medium text-card-foreground">
                <p>We're looking for passionate individuals to contribute to our mission. Explore open roles.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="tonal" className="w-full rounded-md">
                  <Link href="/login">View Details</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-col h-full rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-headline-small text-primary"><Award className="h-6 w-6" /> Annual Innovation Awards</CardTitle>
                <CardDescription className="text-body-medium text-muted-foreground">Recognizing groundbreaking contributions.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow text-body-medium text-card-foreground">
                <p>Nominate individuals or projects pushing the boundaries of global citizenship.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="tonal" className="w-full rounded-md">
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
          <p className="text-title-large mb-2">Global Gateway</p>
          <p className="text-body-medium text-card-foreground max-w-2xl mx-auto">
            Your internal platform to engage in Global Certification and Accreditation at the Global Citizenship Foundation.
            The Portal is globalcertification.org, the Global Gateway is hosted on my.globalcertification.org.
          </p>
          <p className="text-body-small text-muted-foreground mt-4">&copy; {new Date().getFullYear()} Global Citizenship Foundation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}